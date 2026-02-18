"""
msp_service.py — Minimum Support Price validation.

Indian government sets MSP for various crops. Listings priced below MSP
are considered invalid / exploitative and should not be surfaced.

Current implementation uses a simple in-memory dictionary.
In production this would be backed by a database collection or an
external government API, updated periodically.

All prices are in ₹ per kg.
"""

import logging

logger = logging.getLogger(__name__)

# ─── MSP lookup (₹ per kg) ──────────────────────────────────────────────
# Source: approximate 2025-26 government rates (simplified)
_MSP_TABLE: dict[str, float] = {
    "Tomato": 5.0,      # no formal MSP but floor price
    "Onion": 8.0,       # administered price / floor
    "Potato": 6.0,      # administered price / floor
    "Wheat": 23.50,
    "Rice": 22.03,
}


def get_msp(crop: str) -> float:
    """
    Return the MSP for a crop.

    Returns 0.0 for unknown crops (no constraint).
    """
    return _MSP_TABLE.get(crop, 0.0)


def is_above_msp(crop: str, price: float) -> bool:
    """Check whether `price` meets or exceeds the MSP for `crop`."""
    return price >= get_msp(crop)
