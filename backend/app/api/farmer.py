"""
farmer.py — API routes for the Farmer flow.

Endpoints:
    POST /api/farmer/upload   — Create a new crop listing
    GET  /api/farmer/stats    — Dashboard statistics for a farmer

All business logic is delegated to services. The route handler only:
    1. Validates the request (via Pydantic)
    2. Calls service / DB functions
    3. Returns a response
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.config import SUPPORTED_CROPS, MONGO_COLLECTION_LISTINGS
from app.database.mongodb import get_database
from app.queue.redis_queue import enqueue_listing
from app.models.farmer_model import (
    FarmerUploadRequest,
    FarmerUploadResponse,
    ListingDocument,
)
from app.services.msp_service import get_msp, is_above_msp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/farmer", tags=["farmer"])


# ─── GET all listings (for admin / demo view) ───────────────────────────
@router.get("/listings")
async def get_all_listings(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    active_only: bool = Query(True, description="Only show active listings"),
):
    """Return all farmer listings from MongoDB (for the demo dashboard)."""
    db = get_database()
    collection = db[MONGO_COLLECTION_LISTINGS]

    query_filter: dict = {}
    if active_only:
        query_filter["active"] = True
    if crop:
        query_filter["crop"] = crop

    cursor = collection.find(query_filter, {"_id": 0}).sort("created_at", -1)
    docs = await cursor.to_list(length=500)
    return {"count": len(docs), "listings": docs}


# ─── GET farmer dashboard stats ─────────────────────────────────────
@router.get("/stats")
async def get_farmer_stats(
    farmer_name: str = Query(..., description="Farmer name to fetch stats for"),
):
    """Return dashboard statistics for a specific farmer from MongoDB."""
    db = get_database()
    collection = db[MONGO_COLLECTION_LISTINGS]

    # Count active listings
    active_count = await collection.count_documents({
        "farmer_name": farmer_name,
        "active": True,
    })

    # Count total listings (including inactive)
    total_count = await collection.count_documents({
        "farmer_name": farmer_name,
    })

    # Get distinct crops listed by this farmer
    crops = await collection.distinct("crop", {"farmer_name": farmer_name, "active": True})

    # Sum total quantity across active listings
    pipeline = [
        {"$match": {"farmer_name": farmer_name, "active": True}},
        {"$group": {"_id": None, "total_qty": {"$sum": "$quantity"}}},
    ]
    agg = await collection.aggregate(pipeline).to_list(length=1)
    total_quantity = agg[0]["total_qty"] if agg else 0

    # Get recent listings (last 5)
    recent_cursor = collection.find(
        {"farmer_name": farmer_name},
        {"_id": 0, "listing_id": 1, "crop": 1, "quantity": 1, "price": 1, "active": 1, "created_at": 1},
    ).sort("created_at", -1).limit(5)
    recent = await recent_cursor.to_list(length=5)

    return {
        "active_listings": active_count,
        "total_listings": total_count,
        "crops": crops,
        "total_quantity_kg": total_quantity,
        "recent_listings": recent,
    }


@router.post("/upload", response_model=FarmerUploadResponse)
async def upload_listing(payload: FarmerUploadRequest):
    """
    Create a new crop listing.

    Flow:
        1. Validate crop is supported
        2. Validate price ≥ MSP
        3. Generate listing_id (UUID4)
        4. Insert document into MongoDB
        5. Enqueue listing_id into Redis for async HNSW indexing
        6. Return immediately — do NOT block on HNSW insertion
    """

    # ── Validate crop ───────────────────────────────────────────────────
    if payload.crop not in SUPPORTED_CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{payload.crop}'. Choose from: {SUPPORTED_CROPS}",
        )

    # ── Validate MSP ────────────────────────────────────────────────────
    if not is_above_msp(payload.crop, payload.price):
        msp = get_msp(payload.crop)
        raise HTTPException(
            status_code=400,
            detail=f"Price ₹{payload.price}/kg is below the MSP of ₹{msp}/kg for {payload.crop}.",
        )

    # ── Build document ──────────────────────────────────────────────────
    listing_id = str(uuid.uuid4())
    doc = ListingDocument(
        listing_id=listing_id,
        crop=payload.crop,
        quantity=payload.quantity,
        price=payload.price,
        location=payload.location,
        farmer_name=payload.farmer_name,
        active=True,
        created_at=datetime.now(timezone.utc),
    )

    # ── Persist to MongoDB ──────────────────────────────────────────────
    db = get_database()
    collection = db[MONGO_COLLECTION_LISTINGS]
    await collection.insert_one(doc.model_dump())
    logger.info("Saved listing %s to MongoDB", listing_id)

    # ── Enqueue for background HNSW insertion ───────────────────────────
    # This is a quick LPUSH — sub-millisecond, never blocks the response.
    enqueue_listing(listing_id)

    return FarmerUploadResponse(listing_id=listing_id)
