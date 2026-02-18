"""Run 5 merchant test queries and print results."""
import urllib.request, json

API = "http://localhost:8000/api/merchant/search"

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# Merchant location: near Gachibowli, Hyderabad
MERCHANT_LAT = 17.3803
MERCHANT_LON = 78.3816

queries = [
    {
        "name": "TEST 1: Tomato, budget Rs25, 20km radius",
        "payload": {"crop": "Tomato", "quantity": 100, "max_price": 25, "radius": 20,
                    "location": {"latitude": MERCHANT_LAT, "longitude": MERCHANT_LON}},
    },
    {
        "name": "TEST 2: Tomato, budget Rs30, 50km radius (wider)",
        "payload": {"crop": "Tomato", "quantity": 50, "max_price": 30, "radius": 50,
                    "location": {"latitude": MERCHANT_LAT, "longitude": MERCHANT_LON}},
    },
    {
        "name": "TEST 3: Onion, budget Rs18, 25km radius",
        "payload": {"crop": "Onion", "quantity": 500, "max_price": 18, "radius": 25,
                    "location": {"latitude": MERCHANT_LAT, "longitude": MERCHANT_LON}},
    },
    {
        "name": "TEST 4: Potato, budget Rs15, 30km radius",
        "payload": {"crop": "Potato", "quantity": 300, "max_price": 15, "radius": 30,
                    "location": {"latitude": MERCHANT_LAT, "longitude": MERCHANT_LON}},
    },
    {
        "name": "TEST 5: Potato, budget Rs20, 50km radius (all potatoes)",
        "payload": {"crop": "Potato", "quantity": 100, "max_price": 20, "radius": 50,
                    "location": {"latitude": MERCHANT_LAT, "longitude": MERCHANT_LON}},
    },
]

print("=" * 70)
print("  MERCHANT SEARCH TESTS")
print(f"  Merchant location: ({MERCHANT_LAT}, {MERCHANT_LON}) — Gachibowli, Hyderabad")
print("=" * 70)

for q in queries:
    print(f"\n{'─' * 70}")
    print(f"  {q['name']}")
    p = q["payload"]
    print(f"  Query: crop={p['crop']}, qty={p['quantity']}kg, max_price=Rs{p['max_price']}/kg, radius={p['radius']}km")
    print(f"{'─' * 70}")

    result = post(API, p)
    count = result["count"]
    print(f"  Results: {count} farmer(s) found")

    if count > 0:
        print(f"  {'#':<3} {'Crop':<8} {'Price':>8} {'Qty':>8} {'Distance':>10} {'Location':<25}")
        print(f"  {'─'*3} {'─'*8} {'─'*8} {'─'*8} {'─'*10} {'─'*25}")
        for i, r in enumerate(result["results"], 1):
            print(f"  {i:<3} {r['crop']:<8} Rs{r['price']:>5.0f}/kg {r['quantity']:>6.0f}kg {r['distance_km']:>8.2f}km  ({r['latitude']:.4f}, {r['longitude']:.4f})")
    else:
        print("  (no matches)")

print(f"\n{'=' * 70}")
print("  ALL TESTS COMPLETE")
print(f"{'=' * 70}")
