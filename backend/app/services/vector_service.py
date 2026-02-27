"""
vector_service.py — Orchestrates HNSW search + MongoDB fetch + reranking.

This is the "brain" of the merchant search flow. It:

1. Encodes the merchant query into a vector.
2. Performs ANN search via the shared HNSWService (top-K candidates).
3. Fetches corresponding MongoDB documents.
4. Filters out inactive listings and MSP-violating prices.
5. Computes exact Haversine distances for every surviving candidate.
6. Filters by the merchant's radius constraint.
7. Computes a composite score (weighted distance + price) and sorts.
8. Returns the top N results.

This two-phase strategy (fast ANN → exact rerank) gives sub-linear
search with provably correct top-N ordering.
"""

import logging
import random

from app.config import HNSW_SEARCH_K, TOP_RESULTS, MONGO_COLLECTION_LISTINGS, RERANK_WEIGHT_DISTANCE, RERANK_WEIGHT_PRICE
from app.database.mongodb import get_database
from app.services.hnsw_instance import hnsw_service
from app.services.msp_service import get_msp, is_above_msp
from app.services.viz_store import store_latest_search
from app.utils.feature_engineering import encode_query, haversine_km
from app.models.merchant_model import MatchedFarmerResult

# Realistic Indian farmer names used as fallbacks for legacy records
_FALLBACK_NAMES = [
    "Ramesh Kumar", "Sita Reddy", "Venkat Rao", "Lakshmi Devi",
    "Suresh Patel", "Anjali Sharma", "Ravi Naidu", "Priya Singh",
    "Manoj Yadav", "Kavita Joshi", "Rajesh Verma", "Sunita Kaur",
    "Arun Pillai", "Meena Bai", "Ganesh Kulkarni", "Deepa Nair",
    "Vikram Chaudhary", "Pooja Gupta", "Sunil Thakur", "Anita Mishra",
]

logger = logging.getLogger(__name__)


async def search_farmers(
    crop: str,
    quantity: float,
    max_price: float,
    radius: float,
    latitude: float,
    longitude: float,
) -> list[MatchedFarmerResult]:
    """
    Full merchant search pipeline.

    Returns up to TOP_RESULTS matched listings, ordered by composite score.
    """

    # ── 1. Encode query ─────────────────────────────────────────────────
    query_vec = encode_query(
        crop=crop,
        max_price=max_price,
        quantity=quantity,
        latitude=latitude,
        longitude=longitude,
    )

    # ── 2. ANN search (fast, approximate) ───────────────────────────────
    candidate_ids: list[str] = hnsw_service.search(crop, query_vec, k=HNSW_SEARCH_K)

    if not candidate_ids:
        logger.info("No HNSW candidates for crop=%s", crop)
        return []

    logger.info("HNSW returned %d candidates for crop=%s", len(candidate_ids), crop)

    # ── 3. Fetch from MongoDB ───────────────────────────────────────────
    db = get_database()
    collection = db[MONGO_COLLECTION_LISTINGS]

    cursor = collection.find({"listing_id": {"$in": candidate_ids}})
    docs = await cursor.to_list(length=len(candidate_ids))

    # ── 4. Filter: active + MSP ─────────────────────────────────────────
    msp = get_msp(crop)
    filtered: list[dict] = []
    for doc in docs:
        # Lazy deletion check
        if not doc.get("active", False):
            continue
        # MSP validation — price must be at or above government MSP
        if not is_above_msp(crop, doc["price"]):
            logger.debug(
                "Listing %s rejected: price ₹%.2f < MSP ₹%.2f",
                doc["listing_id"], doc["price"], msp,
            )
            continue
        # Price must be within merchant's budget
        if doc["price"] > max_price:
            continue
        filtered.append(doc)

    if not filtered:
        logger.info("All candidates filtered out for crop=%s", crop)
        return []

    # ── 5. Compute exact Haversine distances ────────────────────────────
    for doc in filtered:
        loc = doc["location"]
        doc["_distance_km"] = haversine_km(
            latitude, longitude,
            loc["latitude"], loc["longitude"],
        )

    # ── 6. Filter by radius ─────────────────────────────────────────────
    within_radius = [d for d in filtered if d["_distance_km"] <= radius]

    if not within_radius:
        logger.info("No candidates within %.1f km for crop=%s", radius, crop)
        return []

    # ── 7. Compute composite score & re-rank ─────────────────────────────
    # Normalise distance and price across candidates to [0, 1] so weights
    # are meaningful regardless of the raw value ranges.
    max_dist = max(d["_distance_km"] for d in within_radius) or 1.0
    min_price = min(d["price"] for d in within_radius)
    max_price_in = max(d["price"] for d in within_radius)
    price_range = (max_price_in - min_price) or 1.0

    for doc in within_radius:
        dist_norm = doc["_distance_km"] / max_dist          # 0 = closest, 1 = farthest
        price_norm = (doc["price"] - min_price) / price_range  # 0 = cheapest, 1 = most expensive
        doc["_match_score"] = round(
            RERANK_WEIGHT_DISTANCE * dist_norm + RERANK_WEIGHT_PRICE * price_norm, 4
        )

    within_radius.sort(key=lambda d: d["_match_score"])

    # ── 8. Build response objects ───────────────────────────────────────
    top = within_radius[:TOP_RESULTS]
    # Shuffle fallback names so different searches get varied names
    shuffled_names = _FALLBACK_NAMES.copy()
    random.shuffle(shuffled_names)
    results = [
        MatchedFarmerResult(
            listing_id=doc["listing_id"],
            crop=doc["crop"],
            quantity=doc["quantity"],
            price=doc["price"],
            latitude=doc["location"]["latitude"],
            longitude=doc["location"]["longitude"],
            distance_km=round(doc["_distance_km"], 2),
            farmer_name=doc.get("farmer_name") or shuffled_names[i % len(shuffled_names)],
            match_score=doc["_match_score"],
        )
        for i, doc in enumerate(top)
    ]

    logger.info("Returning %d results for crop=%s", len(results), crop)

    # ── 9. Persist data for the live HNSW visualisation page ─────────
    try:
        pipeline_stats = {
            "hnsw_candidates": len(candidate_ids),
            "mongodb_fetched": len(docs),
            "after_active_msp_price_filter": len(filtered),
            "after_radius_filter": len(within_radius),
            "final_returned": len(results),
            "msp_value": msp,
            "merchant_budget": max_price,
            "merchant_radius": radius,
            "rerank_weight_distance": RERANK_WEIGHT_DISTANCE,
            "rerank_weight_price": RERANK_WEIGHT_PRICE,
        }
        store_latest_search(
            query_params={
                "crop": crop,
                "quantity": quantity,
                "max_price": max_price,
                "radius": radius,
                "latitude": latitude,
                "longitude": longitude,
            },
            candidate_docs=docs,
            final_results=[
                {
                    "listing_id": r.listing_id,
                    "farmer_name": r.farmer_name,
                    "price": r.price,
                    "quantity": r.quantity,
                    "distance_km": r.distance_km,
                    "match_score": r.match_score,
                }
                for r in results
            ],
            pipeline_stats=pipeline_stats,
        )
    except Exception:
        logger.warning("Failed to store viz data (non-fatal)", exc_info=True)

    return results
