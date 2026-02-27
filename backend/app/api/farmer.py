"""
farmer.py — API routes for the Farmer flow.

Endpoints:
    POST /api/farmer/upload   — Create a new crop listing

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
