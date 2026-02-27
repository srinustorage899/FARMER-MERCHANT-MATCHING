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
# Crops without a formal MSP use a reasonable floor price.
_MSP_TABLE: dict[str, float] = {
    # Vegetables (floor prices)
    "Tomato": 5.0,
    "Onion": 8.0,
    "Potato": 6.0,
    "Brinjal": 5.0,
    "Cabbage": 4.0,
    "Carrot": 6.0,
    "Cauliflower": 5.0,
    "Green Chilli": 8.0,
    "Spinach": 4.0,
    "Peas": 10.0,
    "Cucumber": 4.0,
    "Bitter Gourd": 6.0,
    "Okra": 5.0,
    "Garlic": 15.0,
    "Ginger": 20.0,
    # Grains & Cereals (government MSP)
    "Rice": 22.03,
    "Wheat": 23.50,
    "Maize": 20.90,
    "Bajra": 25.50,
    "Jowar": 31.50,
    "Ragi": 38.46,
    "Barley": 18.50,
    # Fruits (floor prices)
    "Mango": 15.0,
    "Banana": 5.0,
    "Apple": 30.0,
    "Grapes": 20.0,
    "Orange": 10.0,
    "Papaya": 5.0,
    "Pomegranate": 25.0,
    "Watermelon": 3.0,
    "Guava": 8.0,
    "Lemon": 10.0,
    # Pulses & Oilseeds (government MSP)
    "Soybean": 44.25,
    "Groundnut": 60.15,
    "Mustard": 55.50,
    "Chana": 53.35,
    "Moong": 82.75,
    "Urad": 69.50,
    "Tur": 71.0,
    "Sunflower": 63.38,
    # Cash Crops
    "Sugarcane": 3.15,
    "Cotton": 67.0,
    "Jute": 50.50,
    "Tea": 50.0,
    "Coffee": 80.0,
    # Spices (floor prices)
    "Turmeric": 30.0,
    "Cumin": 80.0,
    "Coriander": 30.0,
    "Black Pepper": 200.0,
    "Cardamom": 500.0,
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
