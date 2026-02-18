"""
redis_queue.py — Thin wrapper around Redis for the HNSW insertion queue.

Design decisions:
    • Uses the synchronous `redis` client because the background worker
      runs in its own thread and calls BRPOP (blocking pop).
    • BRPOP blocks efficiently server-side, so the worker thread sleeps
      without busy-waiting.
    • Enqueue is called from the async FastAPI route — it is a quick LPUSH,
      so the sub-millisecond blocking is acceptable. If needed later, this
      can be swapped for an async Redis client (aioredis / redis.asyncio).
"""

import logging
import redis

from app.config import REDIS_HOST, REDIS_PORT, REDIS_QUEUE_NAME, REDIS_BRPOP_TIMEOUT

logger = logging.getLogger(__name__)

# ─── Singleton connection ───────────────────────────────────────────────────
_pool: redis.ConnectionPool | None = None
_conn: redis.Redis | None = None


def _get_connection() -> redis.Redis:
    """Return (and lazily create) the shared Redis connection."""
    global _pool, _conn
    if _conn is None:
        _pool = redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        _conn = redis.Redis(connection_pool=_pool)
        logger.info("Redis connection pool created — %s:%s", REDIS_HOST, REDIS_PORT)
    return _conn


def enqueue_listing(listing_id: str) -> None:
    """
    Push a listing_id onto the left of the queue.

    The background worker will BRPOP from the right, giving us FIFO order.
    """
    conn = _get_connection()
    conn.lpush(REDIS_QUEUE_NAME, listing_id)
    logger.info("Enqueued listing_id=%s", listing_id)


def dequeue_listing() -> str | None:
    """
    Blocking pop from the right of the queue.

    Returns the listing_id string, or None if the timeout elapses
    without a message (this lets the worker check its shutdown flag).
    """
    conn = _get_connection()
    result = conn.brpop(REDIS_QUEUE_NAME, timeout=REDIS_BRPOP_TIMEOUT)
    if result is None:
        return None
    # result = (queue_name, value)
    return result[1]


def close_redis() -> None:
    """Gracefully tear down the Redis connection pool."""
    global _pool, _conn
    if _conn is not None:
        _conn.close()
        _conn = None
    if _pool is not None:
        _pool.disconnect()
        _pool = None
        logger.info("Redis connection pool closed.")
