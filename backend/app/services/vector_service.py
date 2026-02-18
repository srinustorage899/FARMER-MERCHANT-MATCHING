"""
vector_service.py — Orchestrates HNSW search + MongoDB fetch + reranking.

This is the "brain" of the merchant search flow. It:

1. Encodes the merchant query into a vector.
2. Performs ANN search via the shared HNSWService (top-K candidates).
3. Fetches corresponding MongoDB documents.
4. Filters out inactive listings and MSP-violating prices.
5. Computes exact Haversine distances for every surviving candidate.
6. Filters by the merchant's radius constraint.
7. Sorts by real distance (ascending) and returns the top N results.

This two-phase strategy (fast ANN → exact rerank) gives sub-linear
search with provably correct top-N ordering.
"""

import logging

from app.config import HNSW_SEARCH_K, TOP_RESULTS, MONGO_COLLECTION_LISTINGS
from app.database.mongodb import get_database
from app.services.hnsw_instance import hnsw_service
from app.services.msp_service import get_msp, is_above_msp
from app.utils.feature_engineering import encode_query, haversine_km
from app.models.merchant_model import MatchedFarmerResult

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

    Returns up to TOP_RESULTS matched listings, ordered by real distance.
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

    # ── 7. Re-rank by real distance (ascending) ─────────────────────────
    within_radius.sort(key=lambda d: d["_distance_km"])

    # ── 8. Build response objects ───────────────────────────────────────
    top = within_radius[:TOP_RESULTS]
    results = [
        MatchedFarmerResult(
            listing_id=doc["listing_id"],
            crop=doc["crop"],
            quantity=doc["quantity"],
            price=doc["price"],
            latitude=doc["location"]["latitude"],
            longitude=doc["location"]["longitude"],
            distance_km=round(doc["_distance_km"], 2),
        )
        for doc in top
    ]

    logger.info("Returning %d results for crop=%s", len(results), crop)
    return results
