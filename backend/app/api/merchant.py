"""
merchant.py — API routes for the Merchant flow.

Endpoints:
    POST /api/merchant/search   — Find nearby farmer listings

All business logic is delegated to vector_service.search_farmers().
The route handler only validates, delegates, and shapes the response.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.config import SUPPORTED_CROPS, DEFAULT_SEARCH_RADIUS
from app.models.merchant_model import MerchantSearchRequest, MerchantSearchResponse
from app.services.vector_service import search_farmers

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/merchant", tags=["merchant"])


@router.post("/search", response_model=MerchantSearchResponse)
async def search_listings(payload: MerchantSearchRequest):
    """
    Search for farmer listings matching the merchant's criteria.

    Pipeline (handled by vector_service):
        1. Encode query → vector
        2. ANN search via HNSW (top 50 candidates)
        3. MongoDB fetch
        4. Filter: active + MSP + price budget
        5. Haversine distance computation
        6. Radius filter (auto-set to 500 km if not specified)
        7. Composite rerank by distance + price
        8. Return top 5
    """

    # ── Validate crop ───────────────────────────────────────────────────
    if payload.crop not in SUPPORTED_CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{payload.crop}'. Choose from: {SUPPORTED_CROPS}",
        )

    # ── Resolve radius (auto-default if not provided) ────────────────
    effective_radius = payload.radius if payload.radius is not None else DEFAULT_SEARCH_RADIUS

    # ── Delegate to the service layer ─────────────────────────────
    try:
        results = await search_farmers(
            crop=payload.crop,
            quantity=payload.quantity,
            max_price=payload.max_price,
            radius=effective_radius,
            latitude=payload.location.latitude,
            longitude=payload.location.longitude,
        )
    except Exception as exc:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail="Search failed. Please try again.") from exc

    return MerchantSearchResponse(
        count=len(results),
        results=results,
    )
