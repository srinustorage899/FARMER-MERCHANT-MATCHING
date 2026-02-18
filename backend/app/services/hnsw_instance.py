"""
hnsw_instance.py — Thread-safe, per-crop HNSW index manager.

CRITICAL ARCHITECTURAL DECISIONS:

1. ONE shared HNSWService singleton is used by BOTH the background worker
   (insertion) and the merchant search endpoint (queries). This avoids
   stale in-memory copies.

2. Each crop gets its OWN hnswlib.Index. This keeps unrelated data
   separate, speeds up search (smaller index), and simplifies deletion.

3. Thread safety is enforced via a `threading.Lock` per index, because
   hnswlib is NOT thread-safe for concurrent writes. Reads are safe
   while no write is in progress, but we lock anyway to be safe.

4. HNSW labels are non-negative integers. We maintain a bidirectional
   mapping (internal_id ↔ listing_id) so the rest of the app only ever
   sees UUID strings.

5. Lazy deletion is handled externally (the `active` field in MongoDB).
   HNSW vectors are NEVER modified in-place — a deactivated listing is
   simply skipped during reranking.

6. Indices are saved to / loaded from disk on shutdown / startup so the
   system survives restarts without re-crawling MongoDB.
"""

import logging
import threading
from pathlib import Path
from typing import Optional

import hnswlib
import numpy as np

from app.config import (
    HNSW_SPACE,
    HNSW_M,
    HNSW_EF_CONSTRUCTION,
    HNSW_EF_SEARCH,
    HNSW_MAX_ELEMENTS_INIT,
    HNSW_INDEX_DIR,
    VECTOR_DIM,
)

logger = logging.getLogger(__name__)


class _CropIndex:
    """
    Internal wrapper around a single hnswlib.Index for one crop,
    plus the internal_id ↔ listing_id mapping.
    """

    def __init__(self, crop: str):
        self.crop = crop
        self.lock = threading.Lock()
        self.index: hnswlib.Index = hnswlib.Index(space=HNSW_SPACE, dim=VECTOR_DIM)
        self.index.init_index(
            max_elements=HNSW_MAX_ELEMENTS_INIT,
            M=HNSW_M,
            ef_construction=HNSW_EF_CONSTRUCTION,
        )
        self.index.set_ef(HNSW_EF_SEARCH)

        # Bidirectional mapping
        self._id_to_listing: dict[int, str] = {}   # internal_id → listing_id
        self._listing_to_id: dict[str, int] = {}   # listing_id → internal_id
        self._next_id: int = 0                      # monotonically increasing

    # ── Capacity management ─────────────────────────────────────────────
    def _ensure_capacity(self) -> None:
        """Double the index capacity if it is about to overflow."""
        current_count = self.index.get_current_count()
        max_elements = self.index.get_max_elements()
        if current_count >= max_elements - 1:
            new_max = max_elements * 2
            self.index.resize_index(new_max)
            logger.info(
                "Resized HNSW index [%s]: %d → %d",
                self.crop, max_elements, new_max,
            )

    # ── Insert ──────────────────────────────────────────────────────────
    def add(self, listing_id: str, vector: np.ndarray) -> int:
        """
        Thread-safe insert of a single vector.

        Returns the internal label assigned.
        """
        with self.lock:
            # Skip duplicates (idempotent re-enqueue)
            if listing_id in self._listing_to_id:
                logger.debug("Duplicate insert skipped: %s", listing_id)
                return self._listing_to_id[listing_id]

            self._ensure_capacity()
            internal_id = self._next_id
            self._next_id += 1

            self.index.add_items(
                data=vector.reshape(1, -1),
                ids=np.array([internal_id]),
            )
            self._id_to_listing[internal_id] = listing_id
            self._listing_to_id[listing_id] = internal_id
            return internal_id

    # ── Query ───────────────────────────────────────────────────────────
    def query(self, vector: np.ndarray, k: int) -> list[str]:
        """
        Return the top-k nearest listing_ids (by L2 distance).

        If the index has fewer than k elements, returns all of them.
        """
        with self.lock:
            count = self.index.get_current_count()
            if count == 0:
                return []
            effective_k = min(k, count)
            labels, _distances = self.index.knn_query(
                data=vector.reshape(1, -1), k=effective_k
            )
            return [
                self._id_to_listing[int(lbl)]
                for lbl in labels[0]
                if int(lbl) in self._id_to_listing
            ]

    # ── Persistence ─────────────────────────────────────────────────────
    def save(self, directory: Path) -> None:
        """Save the hnswlib index and the mapping to disk."""
        import json

        directory.mkdir(parents=True, exist_ok=True)
        index_path = directory / f"{self.crop}.hnsw"
        meta_path = directory / f"{self.crop}.meta.json"

        with self.lock:
            if self.index.get_current_count() > 0:
                self.index.save_index(str(index_path))
            meta = {
                "next_id": self._next_id,
                "id_to_listing": {str(k): v for k, v in self._id_to_listing.items()},
                "listing_to_id": self._listing_to_id,
            }
            meta_path.write_text(json.dumps(meta, indent=2))

        logger.info("Saved HNSW index [%s] — %d vectors", self.crop, self.index.get_current_count())

    def load(self, directory: Path) -> bool:
        """Load a previously saved index. Returns True on success."""
        import json

        index_path = directory / f"{self.crop}.hnsw"
        meta_path = directory / f"{self.crop}.meta.json"

        if not meta_path.exists():
            return False

        try:
            meta = json.loads(meta_path.read_text())
            self._next_id = meta["next_id"]
            self._id_to_listing = {int(k): v for k, v in meta["id_to_listing"].items()}
            self._listing_to_id = meta["listing_to_id"]

            if index_path.exists():
                # Re-init with correct max_elements before loading
                max_el = max(HNSW_MAX_ELEMENTS_INIT, self._next_id + 1000)
                self.index = hnswlib.Index(space=HNSW_SPACE, dim=VECTOR_DIM)
                self.index.init_index(
                    max_elements=max_el,
                    M=HNSW_M,
                    ef_construction=HNSW_EF_CONSTRUCTION,
                )
                self.index.load_index(str(index_path), max_elements=max_el)
                self.index.set_ef(HNSW_EF_SEARCH)

            logger.info(
                "Loaded HNSW index [%s] — %d vectors",
                self.crop, self.index.get_current_count(),
            )
            return True
        except Exception:
            logger.exception("Failed to load HNSW index [%s]", self.crop)
            return False


# ═══════════════════════════════════════════════════════════════════════════
# Public singleton
# ═══════════════════════════════════════════════════════════════════════════

class HNSWService:
    """
    Application-wide HNSW manager.

    Provides per-crop index access. Instantiated once and imported
    wherever needed (worker + search endpoint).
    """

    def __init__(self) -> None:
        self._indices: dict[str, _CropIndex] = {}
        self._global_lock = threading.Lock()

    # ── Index access (lazy creation) ────────────────────────────────────
    def _get_or_create(self, crop: str) -> _CropIndex:
        """Return the _CropIndex for `crop`, creating it if needed."""
        if crop not in self._indices:
            with self._global_lock:
                # Double-check after acquiring lock
                if crop not in self._indices:
                    self._indices[crop] = _CropIndex(crop)
                    logger.info("Created new HNSW index for crop=%s", crop)
        return self._indices[crop]

    # ── Public add / query ──────────────────────────────────────────────
    def add_vector(self, crop: str, listing_id: str, vector: np.ndarray) -> int:
        """Insert a vector into the crop-specific index."""
        idx = self._get_or_create(crop)
        return idx.add(listing_id, vector)

    def search(self, crop: str, vector: np.ndarray, k: int) -> list[str]:
        """
        Return the top-k nearest listing_ids for the given crop index.

        Returns an empty list if no index exists yet for this crop.
        """
        idx = self._indices.get(crop)
        if idx is None:
            return []
        return idx.query(vector, k)

    # ── Lifecycle ───────────────────────────────────────────────────────
    def save_all(self) -> None:
        """Persist every crop index to disk."""
        for crop, idx in self._indices.items():
            idx.save(HNSW_INDEX_DIR)
        logger.info("All HNSW indices saved to %s", HNSW_INDEX_DIR)

    def load_all(self) -> None:
        """Load all previously saved indices from disk."""
        if not HNSW_INDEX_DIR.exists():
            logger.info("No saved HNSW indices found at %s", HNSW_INDEX_DIR)
            return

        import json

        for meta_file in HNSW_INDEX_DIR.glob("*.meta.json"):
            crop = meta_file.stem.replace(".meta", "")
            idx = self._get_or_create(crop)
            idx.load(HNSW_INDEX_DIR)

        logger.info("HNSW indices loaded from %s", HNSW_INDEX_DIR)


# ─── THE singleton instance — imported by worker and search ─────────────
hnsw_service = HNSWService()
