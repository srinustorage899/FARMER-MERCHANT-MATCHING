"""
mongodb.py — MongoDB connection management.

Provides:
    get_database()  → motor AsyncIOMotorDatabase (lazy singleton)
    close_mongo()   → graceful shutdown

Uses Motor (async MongoDB driver) so we never block the FastAPI event loop.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import MONGO_URI, MONGO_DB_NAME

logger = logging.getLogger(__name__)

# ─── Module-level singleton ─────────────────────────────────────────────────
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_database() -> AsyncIOMotorDatabase:
    """
    Return the shared Motor database handle.

    Called once during startup (or lazily on first access).
    The actual TCP connection is established on first I/O, not here.
    """
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(MONGO_URI)
        _db = _client[MONGO_DB_NAME]
        logger.info("MongoDB client initialised — db=%s", MONGO_DB_NAME)
    return _db


async def close_mongo() -> None:
    """Gracefully close the Motor client on app shutdown."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB client closed.")
