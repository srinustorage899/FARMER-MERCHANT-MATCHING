"""
feature_engineering.py — Vector encoding and Haversine distance.

Responsibilities:
    1. Encode a crop listing (or a merchant query) into a fixed-length
       float vector suitable for HNSW L2 search.
    2. Compute the real Haversine great-circle distance for exact reranking.

Vector layout (length = 4 + num_crops):
    [ lat_norm, lon_norm, price_norm, qty_norm, crop_onehot... ]

Normalisation maps raw values into [0, 1] so that L2 distance treats all
dimensions roughly equally. More sophisticated weighting can be added by
multiplying individual dimensions by importance factors.
"""

import math
import numpy as np

from app.config import (
    SUPPORTED_CROPS,
    NORM_LAT_RANGE,
    NORM_LON_RANGE,
    NORM_PRICE_RANGE,
    NORM_QTY_RANGE,
    VECTOR_DIM,
)


# ─── Normalisation helpers ──────────────────────────────────────────────────

def _normalise(value: float, vmin: float, vmax: float) -> float:
    """Linearly scale `value` from [vmin, vmax] → [0, 1], clamped."""
    return max(0.0, min(1.0, (value - vmin) / (vmax - vmin)))


def _crop_one_hot(crop: str) -> list[float]:
    """Return a one-hot list for the given crop name."""
    vec = [0.0] * len(SUPPORTED_CROPS)
    try:
        idx = SUPPORTED_CROPS.index(crop)
        vec[idx] = 1.0
    except ValueError:
        pass  # unknown crop → all zeros (graceful degradation)
    return vec


# ─── Public API ─────────────────────────────────────────────────────────────

def encode_listing(
    crop: str,
    price: float,
    quantity: float,
    latitude: float,
    longitude: float,
) -> np.ndarray:
    """
    Encode a farmer listing into a float32 vector for HNSW insertion.

    Returns:
        np.ndarray of shape (VECTOR_DIM,)
    """
    vec = [
        _normalise(latitude, *NORM_LAT_RANGE),
        _normalise(longitude, *NORM_LON_RANGE),
        _normalise(price, *NORM_PRICE_RANGE),
        _normalise(quantity, *NORM_QTY_RANGE),
    ] + _crop_one_hot(crop)

    return np.array(vec, dtype=np.float32)


def encode_query(
    crop: str,
    max_price: float,
    quantity: float,
    latitude: float,
    longitude: float,
) -> np.ndarray:
    """
    Encode a merchant search query into the same vector space.

    The merchant's `max_price` occupies the price dimension so that
    L2 distance naturally favours listings with prices close to the
    merchant's budget ceiling.
    """
    vec = [
        _normalise(latitude, *NORM_LAT_RANGE),
        _normalise(longitude, *NORM_LON_RANGE),
        _normalise(max_price, *NORM_PRICE_RANGE),
        _normalise(quantity, *NORM_QTY_RANGE),
    ] + _crop_one_hot(crop)

    return np.array(vec, dtype=np.float32)


# ─── Haversine ──────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Great-circle distance between two points on Earth in **kilometres**.

    Used exclusively in the reranking phase — NOT inside HNSW.
    """
    R = 6371.0  # Earth radius in km
    to_rad = math.radians

    d_lat = to_rad(lat2 - lat1)
    d_lon = to_rad(lon2 - lon1)

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
