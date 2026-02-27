"""
config.py — Centralised application configuration.

All tunables live here: MongoDB URI, Redis URI, HNSW hyper-parameters,
supported crops, normalisation ranges, and persistence paths.

Values are read from environment variables with sensible defaults so
the app works out-of-the-box on a local dev machine (Windows + Docker Redis).
"""

import os
from pathlib import Path

# ─── MongoDB ────────────────────────────────────────────────────────────────
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "agrimatch")
MONGO_COLLECTION_LISTINGS: str = "listings"

# ─── Redis ──────────────────────────────────────────────────────────────────
REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
REDIS_QUEUE_NAME: str = "hnsw_insertion_queue"
REDIS_BRPOP_TIMEOUT: int = 2  # seconds — keeps worker responsive to shutdown

# ─── HNSW hyper-parameters ──────────────────────────────────────────────────
HNSW_SPACE: str = "l2"
HNSW_M: int = 16               # max number of bi-directional links per node
HNSW_EF_CONSTRUCTION: int = 200 # size of dynamic candidate list during build
HNSW_EF_SEARCH: int = 100       # size of dynamic candidate list during search
HNSW_MAX_ELEMENTS_INIT: int = 10_000  # initial index capacity (auto-resized)
HNSW_SEARCH_K: int = 50         # top-K candidates before reranking

# ─── Persistence ────────────────────────────────────────────────────────────
# HNSW indices are saved/loaded here on shutdown/startup
HNSW_INDEX_DIR: Path = Path(os.getenv("HNSW_INDEX_DIR", "data/hnsw_indices"))

# ─── Supported crops ────────────────────────────────────────────────────────
# Order matters — it determines the one-hot encoding positions.
SUPPORTED_CROPS: list[str] = [
    # Vegetables
    "Tomato", "Onion", "Potato", "Brinjal", "Cabbage",
    "Carrot", "Cauliflower", "Green Chilli", "Spinach", "Peas",
    "Cucumber", "Bitter Gourd", "Okra", "Garlic", "Ginger",
    # Grains & Cereals
    "Rice", "Wheat", "Maize", "Bajra", "Jowar",
    "Ragi", "Barley",
    # Fruits
    "Mango", "Banana", "Apple", "Grapes", "Orange",
    "Papaya", "Pomegranate", "Watermelon", "Guava", "Lemon",
    # Pulses & Oilseeds
    "Soybean", "Groundnut", "Mustard", "Chana", "Moong",
    "Urad", "Tur", "Sunflower",
    # Cash Crops
    "Sugarcane", "Cotton", "Jute", "Tea", "Coffee",
    # Spices
    "Turmeric", "Cumin", "Coriander", "Black Pepper", "Cardamom",
]

# ─── Normalisation ranges (used for vector encoding) ────────────────────────
# Latitude:  -90 → 90   → normalised to [0, 1]
# Longitude: -180 → 180 → normalised to [0, 1]
# Price:     0 → 500 ₹/kg (generous ceiling)
# Quantity:  0 → 50 000 kg
NORM_LAT_RANGE: tuple[float, float] = (-90.0, 90.0)
NORM_LON_RANGE: tuple[float, float] = (-180.0, 180.0)
NORM_PRICE_RANGE: tuple[float, float] = (0.0, 500.0)
NORM_QTY_RANGE: tuple[float, float] = (0.0, 50_000.0)

# ─── Search / reranking ────────────────────────────────────────────────────
TOP_RESULTS: int = 5  # final results returned to merchant after reranking

# Default search radius (km) when the merchant doesn't specify one.
# HNSW handles proximity via vectors; this is a safety ceiling for the
# exact Haversine reranking phase so we don't return absurdly far results.
DEFAULT_SEARCH_RADIUS: float = float(os.getenv("DEFAULT_SEARCH_RADIUS", "500"))

# Composite reranking weights (must sum to 1.0).
# Adjusting these changes how much distance vs. price matters in final ranking.
RERANK_WEIGHT_DISTANCE: float = float(os.getenv("RERANK_WEIGHT_DISTANCE", "0.6"))
RERANK_WEIGHT_PRICE: float = float(os.getenv("RERANK_WEIGHT_PRICE", "0.4"))

# ─── Vector dimensionality (auto-derived) ──────────────────────────────────
# 4 numeric features + len(SUPPORTED_CROPS) one-hot
VECTOR_DIM: int = 4 + len(SUPPORTED_CROPS)

# ─── CORS ───────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = ["*"]
