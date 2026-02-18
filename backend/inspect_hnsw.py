"""
inspect_hnsw.py — Dump the HNSW graph structure for demonstration.

Shows: nodes (farmers), their vectors, layers, and neighbor connections.
Run while the server is running (it reads from MongoDB + rebuilds a local index).
"""
import json
import numpy as np
from pymongo import MongoClient
import hnswlib
import sys, os

# Add backend to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.config import (
    SUPPORTED_CROPS, HNSW_SPACE, HNSW_M, HNSW_EF_CONSTRUCTION,
    HNSW_EF_SEARCH, VECTOR_DIM, MONGO_URI, MONGO_DB_NAME,
    MONGO_COLLECTION_LISTINGS,
)
from app.utils.feature_engineering import encode_listing

# ── Connect to MongoDB and fetch all listings ──────────────────────────
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
docs = list(db[MONGO_COLLECTION_LISTINGS].find({"active": True}, {"_id": 0}))

if not docs:
    print("No listings found in MongoDB. Upload some first!")
    exit()

# ── Group by crop ──────────────────────────────────────────────────────
crops = {}
for doc in docs:
    crops.setdefault(doc["crop"], []).append(doc)

print("=" * 80)
print("  HNSW GRAPH STRUCTURE — AgriMatch")
print("  Each crop has its OWN separate HNSW index")
print("=" * 80)

for crop, listings in sorted(crops.items()):
    print(f"\n{'━' * 80}")
    print(f"  HNSW INDEX: {crop}")
    print(f"  Space: {HNSW_SPACE} (L2/Euclidean)  |  Dimensions: {VECTOR_DIM}  |  M: {HNSW_M}")
    print(f"  ef_construction: {HNSW_EF_CONSTRUCTION}  |  ef_search: {HNSW_EF_SEARCH}")
    print(f"  Nodes: {len(listings)}")
    print(f"{'━' * 80}")

    # ── Build a local index to inspect the graph ───────────────────────
    index = hnswlib.Index(space=HNSW_SPACE, dim=VECTOR_DIM)
    index.init_index(max_elements=max(len(listings) + 10, 100), M=HNSW_M, ef_construction=HNSW_EF_CONSTRUCTION)
    index.set_ef(HNSW_EF_SEARCH)

    id_map = {}  # internal_id → listing info
    vectors = []

    for i, doc in enumerate(listings):
        loc = doc["location"]
        vec = encode_listing(
            crop=doc["crop"], price=doc["price"], quantity=doc["quantity"],
            latitude=loc["latitude"], longitude=loc["longitude"],
        )
        index.add_items(data=vec.reshape(1, -1), ids=np.array([i]))
        id_map[i] = doc
        vectors.append(vec)

    # ── Print each node (farmer) ───────────────────────────────────────
    print(f"\n  ┌─────────────────────────────────────────────────────────────┐")
    print(f"  │  NODES (each farmer listing = one node in the graph)       │")
    print(f"  └─────────────────────────────────────────────────────────────┘\n")

    for i, doc in id_map.items():
        loc = doc["location"]
        lid = doc["listing_id"][:8]
        vec = vectors[i]
        vec_str = "[" + ", ".join(f"{v:.4f}" for v in vec) + "]"
        print(f"  Node {i}  (listing: {lid}…)")
        print(f"    ├── Crop:     {doc['crop']}")
        print(f"    ├── Price:    ₹{doc['price']}/kg")
        print(f"    ├── Quantity: {doc['quantity']} kg")
        print(f"    ├── Location: ({loc['latitude']:.4f}, {loc['longitude']:.4f})")
        print(f"    └── Vector:   {vec_str}")
        print()

    # ── Print the graph edges (neighbor lists) ─────────────────────────
    print(f"  ┌─────────────────────────────────────────────────────────────┐")
    print(f"  │  GRAPH EDGES (bi-directional neighbor connections)         │")
    print(f"  │  M={HNSW_M} → each node can have up to {HNSW_M*2} neighbors at layer 0  │")
    print(f"  └─────────────────────────────────────────────────────────────┘\n")

    # Get internal data from hnswlib
    for i in range(len(listings)):
        # Use knn_query from each node's vector to find its neighbors
        # hnswlib doesn't expose edges directly, but we can show the
        # nearest-neighbor relationships
        k = min(len(listings), HNSW_M)
        labels, distances = index.knn_query(vectors[i].reshape(1, -1), k=k)

        neighbors = []
        for lbl, dist in zip(labels[0], distances[0]):
            lbl = int(lbl)
            if lbl == i:
                continue  # skip self
            neighbor_doc = id_map[lbl]
            nlid = neighbor_doc["listing_id"][:8]
            neighbors.append(f"Node {lbl} ({nlid}…, ₹{neighbor_doc['price']}/kg, d={dist:.4f})")

        src_doc = id_map[i]
        slid = src_doc["listing_id"][:8]
        print(f"  Node {i} ({slid}…) ──connects to──►")
        for n in neighbors:
            print(f"    ├── {n}")
        if not neighbors:
            print(f"    └── (no neighbors)")
        else:
            # Replace last ├ with └
            pass
        print()

    # ── Distance matrix ────────────────────────────────────────────────
    n = len(listings)
    if n > 1:
        print(f"  ┌─────────────────────────────────────────────────────────────┐")
        print(f"  │  L2 DISTANCE MATRIX (vector space distances between nodes) │")
        print(f"  └─────────────────────────────────────────────────────────────┘\n")

        # Header
        header = "         " + "".join(f"  Node {j:<3}" for j in range(n))
        print(f"  {header}")
        print(f"  {'─' * len(header)}")

        for i in range(n):
            row = f"  Node {i:<3}"
            for j in range(n):
                if i == j:
                    row += "    ——   "
                else:
                    d = np.sum((vectors[i] - vectors[j]) ** 2)  # L2 squared
                    row += f"  {d:6.4f} "
            print(row)
        print()

print(f"\n{'=' * 80}")
print("  HNSW GRAPH EXPLANATION")
print("=" * 80)
print("""
  HOW HNSW WORKS IN THIS APP:

  1. STRUCTURE: A multi-layer navigable small-world graph.
     - Layer 0 (bottom): ALL nodes present, max 2×M neighbors each
     - Layer 1+: Fewer nodes (exponentially), acts as "express lanes"
     - Higher layers = skip connections for fast traversal

  2. INSERTION (when a farmer uploads a crop):
     - The listing is encoded into a 7D vector:
       [lat_norm, lon_norm, price_norm, qty_norm, crop_one_hot...]
     - A random layer is assigned (most nodes → layer 0 only)
     - The node connects to its M nearest existing neighbors
     - Bi-directional edges are created

  3. SEARCH (when a merchant queries):
     - Query is also encoded into the same 7D vector space
     - Search starts at the top layer, greedily descends
     - At layer 0, explores ef_search candidates
     - Returns top-K approximate nearest neighbors
     - These are then filtered (price, radius, MSP) and re-ranked

  4. WHY HNSW?
     - Brute force: O(n) — check every farmer
     - HNSW: O(log n) — follows graph edges to nearest neighbors
     - With 10,000 farmers, HNSW is ~100x faster than brute force

  KEY FILES:
     - hnsw_instance.py  → Graph manager (insert, query, save/load)
     - hnsw_worker.py    → Background thread that inserts nodes
     - vector_service.py → Search pipeline (HNSW → filter → rerank)
     - feature_engineering.py → Vector encoding (7D)
""")
