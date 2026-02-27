"""
main.py — FastAPI application entry point.

Startup sequence:
    1. Load saved HNSW indices from disk (survives restarts)
    2. Initialise MongoDB connection
    3. Launch background HNSW worker thread
    4. Register API routers

Shutdown sequence:
    1. Stop background worker thread
    2. Save all HNSW indices to disk
    3. Close Redis connection
    4. Close MongoDB connection

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from pathlib import Path

from app.config import CORS_ORIGINS
from app.database.mongodb import get_database, close_mongo
from app.queue.redis_queue import close_redis
from app.services.hnsw_instance import hnsw_service
from app.worker.hnsw_worker import start_worker, stop_worker
from app.api.farmer import router as farmer_router
from app.api.merchant import router as merchant_router
from app.api.viz import router as viz_router

# ─── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)-30s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup + shutdown) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle.

    Everything before `yield` runs on startup.
    Everything after `yield` runs on shutdown.
    """
    # ── STARTUP ─────────────────────────────────────────────────────────
    logger.info("══════════════════════════════════════════════════════")
    logger.info("  AgriMatch Backend — Starting up")
    logger.info("══════════════════════════════════════════════════════")

    # 1. Load persisted HNSW indices
    hnsw_service.load_all()

    # 2. Warm up MongoDB connection
    get_database()

    # 3. Start background worker
    start_worker()

    logger.info("Startup complete — ready to serve requests")

    yield  # ── APPLICATION RUNNING ──────────────────────────────────────

    # ── SHUTDOWN ────────────────────────────────────────────────────────
    logger.info("Shutting down…")

    # 1. Stop worker (waits for current iteration to finish)
    stop_worker()

    # 2. Persist HNSW indices so they survive restarts
    hnsw_service.save_all()

    # 3. Close connections
    close_redis()
    await close_mongo()

    logger.info("Shutdown complete.")


# ─── App factory ────────────────────────────────────────────────────────
app = FastAPI(
    title="AgriMatch API",
    description="Farmer–Merchant Matching Platform with HNSW vector search",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────
app.include_router(farmer_router)
app.include_router(merchant_router)
app.include_router(viz_router)


# ─── Health check ───────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


# ─── Demo / visualization pages ────────────────────────────────────────
_backend_root = Path(__file__).resolve().parent.parent

@app.get("/demo/farmers", tags=["demo"], include_in_schema=False)
async def farmers_database_page():
    """Serve the Farmers Database viewer page."""
    return FileResponse(str(_backend_root / "farmers_database.html"))

@app.get("/demo/hnsw", tags=["demo"], include_in_schema=False)
async def hnsw_visualization_page():
    """Serve the HNSW 3D visualization page."""
    return FileResponse(str(_backend_root / "hnsw_visualization.html"))


# ─── Serve frontend static files ────────────────────────────────────────
# Serve the React production build.
# After running `npm run build` in frontend/, the output sits in frontend/dist.
# This must come AFTER API routers so /api/* routes take priority.
_frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if _frontend_dist.is_dir():
    # Serve static assets (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="assets")

    # SPA catch-all: any non-API route returns index.html so React Router works
    @app.get("/{full_path:path}", tags=["frontend"])
    async def serve_spa(full_path: str):
        # If the requested file exists in dist/, serve it directly
        file_path = _frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise fall back to index.html for client-side routing
        return FileResponse(str(_frontend_dist / "index.html"))
else:
    logger.warning(
        "Frontend build not found at %s — run 'npm run build' in frontend/",
        _frontend_dist,
    )
