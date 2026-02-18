"""
hnsw_worker.py — Background worker that consumes the Redis queue
and inserts vectors into the shared HNSW index.

CRITICAL DESIGN:

    This worker runs in a **daemon thread** started on FastAPI startup.
    It blocks on Redis BRPOP (efficient server-side sleep) and processes
    listings one at a time, keeping HNSW insertion OFF the request path.

    Flow per message:
        1. BRPOP listing_id from Redis queue
        2. Fetch the full document from MongoDB
        3. Encode the listing into a hybrid vector
        4. Insert into the crop-specific HNSW index via the shared
           HNSWService singleton
        5. Log success

    The worker respects a threading.Event (`_shutdown`) so it can be
    stopped cleanly during app shutdown.

    MongoDB access from this thread uses a SYNCHRONOUS PyMongo client
    (not Motor) because we are outside the asyncio event loop.
"""

import logging
import threading
from pymongo import MongoClient

from app.config import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTION_LISTINGS
from app.queue.redis_queue import dequeue_listing
from app.services.hnsw_instance import hnsw_service
from app.utils.feature_engineering import encode_listing

logger = logging.getLogger(__name__)

# ─── Module state ───────────────────────────────────────────────────────
_shutdown_event = threading.Event()
_worker_thread: threading.Thread | None = None


def _worker_loop() -> None:
    """
    Main loop — runs in a background thread.

    Uses synchronous PyMongo (not Motor) because we are NOT in an
    asyncio context. Each iteration:
        1. BRPOP from Redis (blocking, with timeout)
        2. Fetch doc from Mongo
        3. Encode → insert into HNSW
    """
    # Each thread gets its own synchronous Mongo client
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[MONGO_DB_NAME]
    collection = db[MONGO_COLLECTION_LISTINGS]

    logger.info("HNSW worker thread started — listening on Redis queue")

    while not _shutdown_event.is_set():
        try:
            listing_id = dequeue_listing()
            if listing_id is None:
                # BRPOP timed out — loop back and check shutdown flag
                continue

            # ── Fetch from MongoDB ──────────────────────────────────────
            doc = collection.find_one({"listing_id": listing_id})
            if doc is None:
                logger.warning("Listing %s not found in MongoDB — skipping", listing_id)
                continue

            if not doc.get("active", False):
                logger.info("Listing %s is inactive — skipping HNSW insert", listing_id)
                continue

            # ── Encode ──────────────────────────────────────────────────
            loc = doc["location"]
            vector = encode_listing(
                crop=doc["crop"],
                price=doc["price"],
                quantity=doc["quantity"],
                latitude=loc["latitude"],
                longitude=loc["longitude"],
            )

            # ── Insert into shared HNSW (thread-safe) ──────────────────
            internal_id = hnsw_service.add_vector(
                crop=doc["crop"],
                listing_id=listing_id,
                vector=vector,
            )
            logger.info(
                "Inserted listing_id=%s → HNSW[%s] internal_id=%d",
                listing_id, doc["crop"], internal_id,
            )

        except Exception:
            logger.exception("Worker error while processing listing")

    # Cleanup
    mongo_client.close()
    logger.info("HNSW worker thread stopped")


# ─── Public lifecycle functions ─────────────────────────────────────────

def start_worker() -> None:
    """Launch the background worker thread (called from FastAPI startup)."""
    global _worker_thread
    _shutdown_event.clear()
    _worker_thread = threading.Thread(target=_worker_loop, daemon=True, name="hnsw-worker")
    _worker_thread.start()
    logger.info("HNSW background worker launched")


def stop_worker() -> None:
    """
    Signal the worker to stop and wait for it to finish
    (called from FastAPI shutdown).
    """
    global _worker_thread
    _shutdown_event.set()
    if _worker_thread is not None:
        _worker_thread.join(timeout=10)
        logger.info("HNSW background worker joined")
        _worker_thread = None
