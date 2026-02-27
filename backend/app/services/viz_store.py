"""
viz_store.py — In-memory store for the latest merchant search,
used by the HNSW 3D visualisation page.

Stores the last query parameters, all candidate farmers (from the index),
and the final results so the viz page can display a live, dynamic view
of real searches rather than hardcoded demo data.
"""

import math
import random
import threading
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np

from app.config import (
    HNSW_M, NORM_LAT_RANGE, NORM_LON_RANGE, NORM_PRICE_RANGE, NORM_QTY_RANGE,
    VECTOR_DIM, SUPPORTED_CROPS,
)
from app.utils.feature_engineering import haversine_km, _normalise

_lock = threading.Lock()
_latest: Optional[dict] = None


# ─── Public API ──────────────────────────────────────────────────────────

def store_latest_search(
    query_params: dict,
    candidate_docs: list[dict],
    final_results: list[dict],
    pipeline_stats: Optional[dict] = None,
) -> None:
    """
    Called by vector_service after every search to persist the data
    needed by the visualisation endpoint.
    """
    global _latest
    viz = _build_viz(query_params, candidate_docs, final_results, pipeline_stats)
    with _lock:
        _latest = viz


def get_latest_viz() -> Optional[dict]:
    """Return the latest visualisation payload (or None)."""
    with _lock:
        return _latest


# ─── Internal builders ──────────────────────────────────────────────────

def _build_viz(
    query_params: dict,
    candidate_docs: list[dict],
    final_results: list[dict],
    pipeline_stats: Optional[dict] = None,
) -> dict:
    """
    Build the full data structure consumed by the 3D vis page.

    Steps:
        1. Pick a manageable subset of farmers (max 20).
        2. Assign them to HNSW layers probabilistically.
        3. Generate intra-layer edges (nearest neighbours).
        4. Simulate a greedy traversal path from entry → result.
    """

    # ── 1. Farmer list (cap at 20 for readability) ──────────────────────
    result_ids = {r["listing_id"] for r in final_results}

    # Prioritise: results first, then remaining candidates
    results_first = [d for d in candidate_docs if d["listing_id"] in result_ids]
    others = [d for d in candidate_docs if d["listing_id"] not in result_ids]
    random.shuffle(others)
    pool = (results_first + others)[:20]

    # Assign local integer IDs 0..n-1
    farmers = []
    for i, doc in enumerate(pool):
        loc = doc.get("location", {})
        farmers.append({
            "id": i,
            "listing_id": doc["listing_id"],
            "name": doc.get("farmer_name", f"Farmer {i}"),
            "crop": doc.get("crop", query_params["crop"]),
            "price": doc.get("price", 0),
            "qty": doc.get("quantity", 0),
            "lat": loc.get("latitude", 0),
            "lon": loc.get("longitude", 0),
        })

    n = len(farmers)
    if n == 0:
        return _empty_viz(query_params)

    # Map listing_id → local id
    lid_to_id = {f["listing_id"]: f["id"] for f in farmers}

    # ── 2. Layer assignment (probabilistic, HNSW-style) ─────────────────
    # In HNSW, node level = floor(-ln(uniform) * mL) where mL = 1/ln(M)
    mL = 1.0 / math.log(HNSW_M)
    max_layer = 2  # cap at 3 layers for viz clarity

    node_max_layer = {}
    for f in farmers:
        level = min(max_layer, int(-math.log(random.random() + 1e-9) * mL))
        node_max_layer[f["id"]] = level

    # Ensure at least 2 nodes in layer 2, and result nodes are in layer 0
    top_nodes = [fid for fid, lv in node_max_layer.items() if lv >= 2]
    if len(top_nodes) < 2:
        candidates = list(range(n))
        random.shuffle(candidates)
        for c in candidates:
            if node_max_layer[c] < 2:
                node_max_layer[c] = 2
                top_nodes.append(c)
            if len(top_nodes) >= 2:
                break

    layer_nodes: dict[int, list[int]] = {0: [], 1: [], 2: []}
    for fid in range(n):
        for layer in range(node_max_layer[fid] + 1):
            layer_nodes[layer].append(fid)

    # ── 3. Build edges per layer (k-nearest in simplified metric) ───────
    layer_edges: dict[int, list[list[int]]] = {0: [], 1: [], 2: []}

    for layer in range(3):
        nodes_in_layer = layer_nodes[layer]
        if len(nodes_in_layer) < 2:
            continue
        edge_set: set[tuple[int, int]] = set()
        # Connect each node to its nearest neighbours by distance
        max_edges_per_node = min(HNSW_M, len(nodes_in_layer) - 1)
        for a in nodes_in_layer:
            fa = farmers[a]
            dists = []
            for b in nodes_in_layer:
                if b == a:
                    continue
                fb = farmers[b]
                d = haversine_km(fa["lat"], fa["lon"], fb["lat"], fb["lon"])
                d += abs(fa["price"] - fb["price"]) * 0.1
                dists.append((d, b))
            dists.sort()
            for _, b in dists[:max_edges_per_node]:
                edge = (min(a, b), max(a, b))
                edge_set.add(edge)
        layer_edges[layer] = [list(e) for e in edge_set]

    # ── 4. Simulate traversal path ──────────────────────────────────────
    q_lat = query_params["latitude"]
    q_lon = query_params["longitude"]
    q_price = query_params["max_price"]

    def dist_to_query(fid: int) -> float:
        f = farmers[fid]
        geo = haversine_km(q_lat, q_lon, f["lat"], f["lon"])
        price_diff = abs(f["price"] - q_price) * 0.1
        return geo + price_diff

    # Determine result node (best match = first in final_results that's in our pool)
    result_node = None
    for r in final_results:
        if r["listing_id"] in lid_to_id:
            result_node = lid_to_id[r["listing_id"]]
            break

    query_path: list[dict] = []
    entry_layer = max(layer_nodes.keys(), key=lambda l: len(layer_nodes[l]) > 0 and l or -1)
    # Start from the actual top populated layer
    for l in [2, 1, 0]:
        if layer_nodes[l]:
            entry_layer = l
            break

    # Pick entry point (random node in top layer)
    current = layer_nodes[entry_layer][0] if layer_nodes[entry_layer] else 0
    # First step — entry
    query_path.append({
        "layer": entry_layer,
        "node": current,
        "action": "enter",
        "desc": f"Enter HNSW at Layer {entry_layer} — start at entry point F{current} ({farmers[current]['name']})",
    })

    for layer in range(entry_layer, -1, -1):
        nodes = set(layer_nodes[layer])
        if current not in nodes:
            # Find closest node in this layer to start
            current = min(nodes, key=dist_to_query)

        # Greedy traverse within this layer
        improved = True
        steps = 0
        while improved and steps < 6:
            improved = False
            # Find neighbours of current in this layer
            neighbours = set()
            for a, b in layer_edges[layer]:
                if a == current:
                    neighbours.add(b)
                elif b == current:
                    neighbours.add(a)

            cur_dist = dist_to_query(current)
            best_next = None
            best_dist = cur_dist

            for nb in neighbours:
                d = dist_to_query(nb)
                if d < best_dist:
                    best_dist = d
                    best_next = nb

            if best_next is not None:
                current = best_next
                improved = True
                steps += 1
                query_path.append({
                    "layer": layer,
                    "node": current,
                    "action": "traverse",
                    "desc": f"Traverse to F{current} ({farmers[current]['name']}) — closer to query (d={best_dist:.2f})",
                })

        # Descend to next layer
        if layer > 0:
            query_path.append({
                "layer": layer - 1,
                "node": current,
                "action": "descend",
                "desc": f"Descend to Layer {layer - 1} at F{current} ({farmers[current]['name']}) — denser connections",
            })

    # Final "found" step
    if result_node is not None and current != result_node:
        # Walk to the actual result if greedy didn't land there
        query_path.append({
            "layer": 0,
            "node": result_node,
            "action": "traverse",
            "desc": f"Traverse to F{result_node} ({farmers[result_node]['name']}) — best candidate",
        })
        current = result_node

    query_path.append({
        "layer": 0,
        "node": current,
        "action": "found",
        "desc": f"Nearest neighbor found! F{current} ({farmers[current]['name']}) — Rs{farmers[current]['price']}/kg, {farmers[current]['qty']}kg",
    })

    # ── 5. HNSW parameters ──────────────────────────────────────────────
    from app.config import HNSW_EF_SEARCH, HNSW_EF_CONSTRUCTION, VECTOR_DIM

    # ── 6. Build vector encoding explanation ─────────────────────────
    q_lat_norm = round(_normalise(q_lat, *NORM_LAT_RANGE), 4)
    q_lon_norm = round(_normalise(q_lon, *NORM_LON_RANGE), 4)
    q_price_norm = round(_normalise(q_price, *NORM_PRICE_RANGE), 4)
    q_qty_norm = round(_normalise(query_params.get("quantity", 0), *NORM_QTY_RANGE), 4)
    crop_index = SUPPORTED_CROPS.index(query_params["crop"]) if query_params["crop"] in SUPPORTED_CROPS else -1

    vector_encoding = {
        "total_dimensions": VECTOR_DIM,
        "numeric_features": 4,
        "crop_one_hot_size": len(SUPPORTED_CROPS),
        "layout": "[lat_norm, lon_norm, price_norm, qty_norm, crop_one_hot...]",
        "query_vector_preview": {
            "lat_norm": q_lat_norm,
            "lon_norm": q_lon_norm,
            "price_norm": q_price_norm,
            "qty_norm": q_qty_norm,
            "crop_index": crop_index,
            "crop_name": query_params["crop"],
        },
        "normalisation_ranges": {
            "latitude": list(NORM_LAT_RANGE),
            "longitude": list(NORM_LON_RANGE),
            "price": list(NORM_PRICE_RANGE),
            "quantity": list(NORM_QTY_RANGE),
        },
    }

    return {
        "query": query_params,
        "farmers": farmers,
        "layer_nodes": {str(k): v for k, v in layer_nodes.items()},
        "layer_edges": {str(k): v for k, v in layer_edges.items()},
        "query_path": query_path,
        "hnsw_params": {
            "space": "L2 (Euclidean)",
            "dimensions": VECTOR_DIM,
            "M": HNSW_M,
            "ef_construction": HNSW_EF_CONSTRUCTION,
            "ef_search": HNSW_EF_SEARCH,
            "total_farmers": n,
        },
        "vector_encoding": vector_encoding,
        "pipeline_stats": pipeline_stats or {},
        "results": [
            {
                "listing_id": r["listing_id"],
                "farmer_name": r.get("farmer_name", "Unknown"),
                "price": r.get("price", 0),
                "quantity": r.get("quantity", 0),
                "distance_km": r.get("distance_km", 0),
            }
            for r in final_results
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _empty_viz(query_params: dict) -> dict:
    """Return an empty viz payload when no farmers were found."""
    return {
        "query": query_params,
        "farmers": [],
        "layer_nodes": {"0": [], "1": [], "2": []},
        "layer_edges": {"0": [], "1": [], "2": []},
        "query_path": [],
        "hnsw_params": {},
        "results": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
