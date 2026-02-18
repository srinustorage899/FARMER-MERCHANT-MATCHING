"""
visualize_hnsw.py — Generate an interactive HTML visualization of the HNSW graph.

Opens in the browser showing:
  - Nodes (farmers) as circles with crop details
  - Edges (neighbor connections) with L2 distances
  - Color-coded by crop
  - Distance matrix heatmap
  - Click nodes for details

Run:  python visualize_hnsw.py
"""
import json, webbrowser, os, sys, math
import numpy as np
from pymongo import MongoClient

sys.path.insert(0, os.path.dirname(__file__))

from app.config import (
    SUPPORTED_CROPS, HNSW_SPACE, HNSW_M, HNSW_EF_CONSTRUCTION,
    HNSW_EF_SEARCH, VECTOR_DIM, MONGO_URI, MONGO_DB_NAME,
    MONGO_COLLECTION_LISTINGS,
)
from app.utils.feature_engineering import encode_listing, haversine_km
import hnswlib

# ── Fetch data ─────────────────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
docs = list(db[MONGO_COLLECTION_LISTINGS].find({"active": True}, {"_id": 0}))

if not docs:
    print("No listings found! Upload some first.")
    exit()

# ── Group by crop and build graph data ─────────────────────────────────
CROP_COLORS = {"Tomato": "#e74c3c", "Onion": "#9b59b6", "Potato": "#f39c12"}
CROP_BG     = {"Tomato": "#fdedec", "Onion": "#f4ecf7", "Potato": "#fef9e7"}

crops_data = {}
for doc in docs:
    crops_data.setdefault(doc["crop"], []).append(doc)

all_graphs = {}

for crop, listings in crops_data.items():
    index = hnswlib.Index(space=HNSW_SPACE, dim=VECTOR_DIM)
    index.init_index(max_elements=max(len(listings)+10, 100), M=HNSW_M, ef_construction=HNSW_EF_CONSTRUCTION)
    index.set_ef(HNSW_EF_SEARCH)

    vectors = []
    nodes = []
    for i, doc in enumerate(listings):
        loc = doc["location"]
        vec = encode_listing(crop=doc["crop"], price=doc["price"], quantity=doc["quantity"],
                             latitude=loc["latitude"], longitude=loc["longitude"])
        index.add_items(data=vec.reshape(1,-1), ids=np.array([i]))
        vectors.append(vec)
        nodes.append({
            "id": i,
            "listing_id": doc["listing_id"][:8],
            "crop": doc["crop"],
            "price": doc["price"],
            "quantity": doc["quantity"],
            "lat": loc["latitude"],
            "lon": loc["longitude"],
            "vector": [round(float(v), 4) for v in vec],
        })

    edges = []
    seen = set()
    for i in range(len(listings)):
        k = min(len(listings), HNSW_M)
        labels, distances = index.knn_query(vectors[i].reshape(1,-1), k=k)
        for lbl, dist in zip(labels[0], distances[0]):
            j = int(lbl)
            if j == i:
                continue
            edge_key = tuple(sorted((i, j)))
            if edge_key not in seen:
                seen.add(edge_key)
                # Also compute real-world distance
                real_km = haversine_km(
                    nodes[i]["lat"], nodes[i]["lon"],
                    nodes[j]["lat"], nodes[j]["lon"]
                )
                edges.append({
                    "from": i, "to": j,
                    "l2_dist": round(float(dist), 6),
                    "real_km": round(real_km, 2),
                })

    # Distance matrix
    n = len(listings)
    dist_matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                row.append(round(float(np.sum((vectors[i] - vectors[j])**2)), 6))
        dist_matrix.append(row)

    all_graphs[crop] = {"nodes": nodes, "edges": edges, "dist_matrix": dist_matrix}

graph_json = json.dumps(all_graphs)
crop_colors_json = json.dumps(CROP_COLORS)
crop_bg_json = json.dumps(CROP_BG)

# ── Generate HTML ──────────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HNSW Graph Visualization — AgriMatch</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e0e0e0; }}

  .header {{
    text-align: center; padding: 24px 20px 16px;
    background: linear-gradient(135deg, #1a1d2e 0%, #0f1117 100%);
    border-bottom: 1px solid #2a2d3e;
  }}
  .header h1 {{ font-size: 28px; color: #fff; margin-bottom: 4px; }}
  .header p {{ color: #8892b0; font-size: 14px; }}

  .tabs {{
    display: flex; justify-content: center; gap: 8px;
    padding: 16px; background: #161822;
    border-bottom: 1px solid #2a2d3e;
  }}
  .tab {{
    padding: 10px 28px; border-radius: 8px; cursor: pointer;
    font-weight: 600; font-size: 15px; border: 2px solid transparent;
    transition: all 0.2s;
  }}
  .tab:hover {{ filter: brightness(1.2); }}
  .tab.active {{ border-color: currentColor; box-shadow: 0 0 15px rgba(255,255,255,0.1); }}

  .main {{ display: flex; height: calc(100vh - 140px); }}

  .graph-panel {{
    flex: 1; position: relative; background: #0f1117;
  }}
  canvas {{ display: block; }}

  .side-panel {{
    width: 360px; background: #161822; border-left: 1px solid #2a2d3e;
    overflow-y: auto; padding: 20px;
  }}

  .info-section {{
    background: #1e2130; border-radius: 10px; padding: 16px;
    margin-bottom: 14px; border: 1px solid #2a2d3e;
  }}
  .info-section h3 {{
    font-size: 13px; text-transform: uppercase; letter-spacing: 1px;
    color: #8892b0; margin-bottom: 10px;
  }}

  .stat {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #252840; }}
  .stat:last-child {{ border-bottom: none; }}
  .stat-label {{ color: #8892b0; font-size: 13px; }}
  .stat-value {{ color: #fff; font-weight: 600; font-size: 13px; }}

  .node-detail {{
    background: #1e2130; border-radius: 10px; padding: 16px;
    margin-bottom: 14px; border: 1px solid #2a2d3e; display: none;
  }}
  .node-detail.visible {{ display: block; }}
  .node-detail h3 {{ color: #fff; font-size: 16px; margin-bottom: 10px; }}

  .vector-display {{
    background: #0f1117; border-radius: 6px; padding: 10px;
    font-family: 'Cascadia Code', 'Fira Code', monospace;
    font-size: 12px; word-break: break-all; color: #64ffda;
    margin-top: 8px;
  }}

  .legend {{
    display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px;
  }}
  .legend-item {{
    display: flex; align-items: center; gap: 6px; font-size: 12px;
  }}
  .legend-dot {{
    width: 12px; height: 12px; border-radius: 50%; display: inline-block;
  }}

  .matrix-table {{
    width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;
  }}
  .matrix-table th, .matrix-table td {{
    padding: 6px 4px; text-align: center; border: 1px solid #2a2d3e;
  }}
  .matrix-table th {{ background: #252840; color: #8892b0; }}

  .explanation {{
    background: #1a2332; border: 1px solid #234; border-radius: 10px;
    padding: 16px; margin-bottom: 14px;
  }}
  .explanation h3 {{ color: #64ffda; margin-bottom: 8px; }}
  .explanation p {{ font-size: 13px; line-height: 1.6; color: #a0aec0; }}
  .explanation code {{
    background: #0f1117; padding: 2px 6px; border-radius: 4px;
    font-family: monospace; color: #f7c948; font-size: 12px;
  }}

  .tooltip {{
    position: absolute; background: #1e2130; border: 1px solid #3a3d5e;
    border-radius: 8px; padding: 12px; font-size: 12px;
    pointer-events: none; display: none; z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }}
</style>
</head>
<body>

<div class="header">
  <h1>🌾 HNSW Graph Structure — AgriMatch</h1>
  <p>Each farmer listing is a node · Edges show nearest-neighbor connections · Colors = crop type</p>
</div>

<div class="tabs" id="tabs"></div>

<div class="main">
  <div class="graph-panel">
    <canvas id="graphCanvas"></canvas>
    <div class="tooltip" id="tooltip"></div>
  </div>
  <div class="side-panel" id="sidePanel"></div>
</div>

<script>
const ALL_GRAPHS = {graph_json};
const CROP_COLORS = {crop_colors_json};
const CROP_BG = {crop_bg_json};

let currentCrop = Object.keys(ALL_GRAPHS)[0];
let canvas, ctx, W, H;
let nodePositions = [];
let hoveredNode = null;
let selectedNode = null;
let animProgress = 0;
let animFrame;

// ── Tabs ──────────────────────────────────────────────────────────────
function buildTabs() {{
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = '';
  for (const crop of Object.keys(ALL_GRAPHS)) {{
    const btn = document.createElement('div');
    btn.className = 'tab' + (crop === currentCrop ? ' active' : '');
    btn.textContent = crop + ' (' + ALL_GRAPHS[crop].nodes.length + ' nodes)';
    btn.style.color = CROP_COLORS[crop] || '#64ffda';
    btn.style.background = (CROP_BG[crop] || '#1e2130') + '22';
    btn.onclick = () => {{ currentCrop = crop; buildTabs(); init(); }};
    tabsEl.appendChild(btn);
  }}
}}

// ── Layout: circular with slight jitter ───────────────────────────────
function layoutNodes(nodes) {{
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) * 0.32;
  nodePositions = nodes.map((n, i) => {{
    const angle = (2 * Math.PI * i / nodes.length) - Math.PI / 2;
    return {{
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      node: n,
    }};
  }});
}}

// ── Draw ──────────────────────────────────────────────────────────────
function draw() {{
  const graph = ALL_GRAPHS[currentCrop];
  const color = CROP_COLORS[currentCrop] || '#64ffda';
  ctx.clearRect(0, 0, W, H);

  // Grid background
  ctx.strokeStyle = '#1a1d2e';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {{ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }}
  for (let y = 0; y < H; y += 40) {{ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }}

  // Edges
  for (const edge of graph.edges) {{
    const a = nodePositions[edge.from];
    const b = nodePositions[edge.to];
    const isHighlighted = selectedNode !== null && (edge.from === selectedNode || edge.to === selectedNode);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = isHighlighted ? color : '#2a2d3e';
    ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
    ctx.stroke();

    // Edge label
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = '10px monospace';
    ctx.fillStyle = isHighlighted ? '#fff' : '#555';
    ctx.textAlign = 'center';
    ctx.fillText('d=' + edge.l2_dist.toFixed(4), mx, my - 6);
    ctx.fillText(edge.real_km + 'km', mx, my + 8);
  }}

  // Nodes
  for (let i = 0; i < nodePositions.length; i++) {{
    const p = nodePositions[i];
    const n = p.node;
    const isHovered = hoveredNode === i;
    const isSelected = selectedNode === i;
    const r = isHovered || isSelected ? 32 : 26;

    // Glow
    if (isSelected || isHovered) {{
      const grad = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 2);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }}

    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? color : (isHovered ? color + 'bb' : '#1e2130');
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();

    // Label
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillStyle = isSelected ? '#fff' : color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N' + i, p.x, p.y - 4);

    ctx.font = '10px Segoe UI';
    ctx.fillStyle = isSelected ? '#ddd' : '#8892b0';
    ctx.fillText('₹' + n.price + '/kg', p.x, p.y + 10);
  }}

  // Title
  ctx.font = 'bold 16px Segoe UI';
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('HNSW Index: ' + currentCrop, 20, 20);
  ctx.font = '12px Segoe UI';
  ctx.fillStyle = '#8892b0';
  ctx.fillText(graph.nodes.length + ' nodes · ' + graph.edges.length + ' edges · M=' + {HNSW_M} + ' · dim=' + {VECTOR_DIM}, 20, 42);
}}

// ── Interaction ───────────────────────────────────────────────────────
function getNodeAt(x, y) {{
  for (let i = nodePositions.length - 1; i >= 0; i--) {{
    const p = nodePositions[i];
    if (Math.hypot(x - p.x, y - p.y) < 30) return i;
  }}
  return null;
}}

function onMouseMove(e) {{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const prev = hoveredNode;
  hoveredNode = getNodeAt(x, y);
  canvas.style.cursor = hoveredNode !== null ? 'pointer' : 'default';

  const tooltip = document.getElementById('tooltip');
  if (hoveredNode !== null) {{
    const n = nodePositions[hoveredNode].node;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY - 10) + 'px';
    tooltip.innerHTML = '<b>Node ' + hoveredNode + '</b> (' + n.listing_id + '…)<br>' +
      'Price: ₹' + n.price + '/kg<br>Qty: ' + n.quantity + ' kg<br>' +
      'Location: (' + n.lat.toFixed(4) + ', ' + n.lon.toFixed(4) + ')';
  }} else {{
    tooltip.style.display = 'none';
  }}
  if (prev !== hoveredNode) draw();
}}

function onClick(e) {{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  selectedNode = getNodeAt(x, y);
  draw();
  updateSidePanel();
}}

// ── Side panel ────────────────────────────────────────────────────────
function updateSidePanel() {{
  const graph = ALL_GRAPHS[currentCrop];
  const color = CROP_COLORS[currentCrop] || '#64ffda';
  let html = '';

  // HNSW params
  html += '<div class="info-section"><h3>⚙ HNSW Parameters</h3>';
  html += stat('Space', '{HNSW_SPACE} (Euclidean L2)');
  html += stat('Dimensions', '{VECTOR_DIM}');
  html += stat('M (max neighbors)', '{HNSW_M}');
  html += stat('ef_construction', '{HNSW_EF_CONSTRUCTION}');
  html += stat('ef_search', '{HNSW_EF_SEARCH}');
  html += stat('Nodes in index', graph.nodes.length);
  html += stat('Edges', graph.edges.length);
  html += '</div>';

  // Explanation
  html += '<div class="explanation"><h3>📐 How the Graph Works</h3>';
  html += '<p>Each <b>farmer listing</b> is encoded into a <code>7D vector</code>:<br>';
  html += '<code>[lat, lon, price, qty, crop_onehot...]</code><br><br>';
  html += 'When a farmer uploads, the vector is <b>inserted as a node</b> ';
  html += 'and connected to its <b>M nearest neighbors</b> via bi-directional edges.<br><br>';
  html += 'When a merchant searches, the query is encoded into the same space and the graph is ';
  html += '<b>traversed greedily</b> to find approximate nearest neighbors in <b>O(log n)</b> time.</p></div>';

  // Selected node
  if (selectedNode !== null) {{
    const n = graph.nodes[selectedNode];
    html += '<div class="info-section"><h3 style="color:' + color + '">🔍 Selected: Node ' + selectedNode + '</h3>';
    html += stat('Listing ID', n.listing_id + '…');
    html += stat('Crop', n.crop);
    html += stat('Price', '₹' + n.price + '/kg');
    html += stat('Quantity', n.quantity + ' kg');
    html += stat('Location', '(' + n.lat.toFixed(4) + ', ' + n.lon.toFixed(4) + ')');
    html += '<div class="vector-display">Vector: [' + n.vector.join(', ') + ']</div>';

    // Neighbors
    const neighbors = graph.edges.filter(e => e.from === selectedNode || e.to === selectedNode);
    if (neighbors.length) {{
      html += '<h3 style="margin-top:12px">Neighbors</h3>';
      for (const e of neighbors) {{
        const other = e.from === selectedNode ? e.to : e.from;
        const on = graph.nodes[other];
        html += '<div class="stat"><span class="stat-label">→ Node ' + other + ' (₹' + on.price + '/kg)</span>';
        html += '<span class="stat-value">d=' + e.l2_dist.toFixed(4) + ' · ' + e.real_km + 'km</span></div>';
      }}
    }}
    html += '</div>';
  }}

  // Distance matrix
  html += '<div class="info-section"><h3>📊 L2 Distance Matrix</h3>';
  html += '<table class="matrix-table"><tr><th></th>';
  for (let j = 0; j < graph.nodes.length; j++) html += '<th>N' + j + '</th>';
  html += '</tr>';
  for (let i = 0; i < graph.dist_matrix.length; i++) {{
    html += '<tr><th>N' + i + '</th>';
    for (let j = 0; j < graph.dist_matrix[i].length; j++) {{
      const v = graph.dist_matrix[i][j];
      const intensity = Math.min(v * 2000, 1);
      const bg = i === j ? '#252840' : 'rgba(' + hexToRgb(color) + ',' + (0.1 + intensity * 0.5) + ')';
      const sel = (selectedNode === i || selectedNode === j) ? 'color:#fff;font-weight:bold;' : '';
      html += '<td style="background:' + bg + ';' + sel + '">' + (i === j ? '—' : v.toFixed(4)) + '</td>';
    }}
    html += '</tr>';
  }}
  html += '</table></div>';

  // All nodes
  html += '<div class="info-section"><h3>📋 All Nodes</h3>';
  for (const n of graph.nodes) {{
    const isSel = selectedNode === n.id;
    html += '<div class="stat" style="' + (isSel ? 'background:#252840;border-radius:4px;padding:4px 6px;' : '') + '">';
    html += '<span class="stat-label">' + (isSel ? '▸ ' : '') + 'N' + n.id + ' ₹' + n.price + '/kg · ' + n.quantity + 'kg</span>';
    html += '<span class="stat-value">' + n.listing_id + '…</span></div>';
  }}
  html += '</div>';

  document.getElementById('sidePanel').innerHTML = html;
}}

function stat(label, value) {{
  return '<div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span></div>';
}}

function hexToRgb(hex) {{
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return r + ',' + g + ',' + b;
}}

// ── Init ──────────────────────────────────────────────────────────────
function init() {{
  canvas = document.getElementById('graphCanvas');
  ctx = canvas.getContext('2d');
  const panel = canvas.parentElement;
  W = canvas.width = panel.clientWidth;
  H = canvas.height = panel.clientHeight;

  selectedNode = null;
  hoveredNode = null;
  layoutNodes(ALL_GRAPHS[currentCrop].nodes);
  draw();
  updateSidePanel();
}}

window.addEventListener('resize', init);
canvas = document.getElementById('graphCanvas');
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('click', onClick);

buildTabs();
init();
</script>
</body>
</html>
"""

out_path = os.path.join(os.path.dirname(__file__), "hnsw_visualization.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Visualization saved to: {out_path}")
print("Opening in browser...")
webbrowser.open("file:///" + out_path.replace("\\", "/"))
