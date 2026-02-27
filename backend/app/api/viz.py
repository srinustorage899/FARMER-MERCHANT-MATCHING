"""
viz.py — API route for the live HNSW visualisation page.

Endpoint:
    GET /api/viz/latest   — Return the latest merchant search data
                            formatted for the 3D visualisation.
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.viz_store import get_latest_viz

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/viz", tags=["visualisation"])


@router.get("/latest")
async def latest_viz():
    """
    Returns the data for the most recent merchant search,
    including farmer nodes, HNSW layer assignments, edges,
    and the simulated traversal path.

    If no search has been performed yet, returns 204 No Content.
    """
    data = get_latest_viz()
    if data is None:
        return JSONResponse(
            status_code=204,
            content={"detail": "No merchant search has been performed yet."},
        )
    return data
