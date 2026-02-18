"""Seed 10 farmer listings for testing."""
import urllib.request, json, time

API = "http://localhost:8000/api/farmer/upload"

def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

listings = [
    # TOMATO (MSP >= 5)
    {"crop": "Tomato", "quantity": 200,  "price": 18, "location": {"latitude": 17.3850, "longitude": 78.4867}},  # Hyderabad center
    {"crop": "Tomato", "quantity": 500,  "price": 22, "location": {"latitude": 17.4400, "longitude": 78.3500}},  # Kukatpally
    {"crop": "Tomato", "quantity": 150,  "price": 15, "location": {"latitude": 17.3616, "longitude": 78.4747}},  # Mehdipatnam
    {"crop": "Tomato", "quantity": 800,  "price": 28, "location": {"latitude": 17.4948, "longitude": 78.3996}},  # Secunderabad
    # ONION (MSP >= 8)
    {"crop": "Onion",  "quantity": 1000, "price": 12, "location": {"latitude": 17.3500, "longitude": 78.5500}},  # LB Nagar
    {"crop": "Onion",  "quantity": 600,  "price": 16, "location": {"latitude": 17.4100, "longitude": 78.4600}},  # Ameerpet
    {"crop": "Onion",  "quantity": 300,  "price": 20, "location": {"latitude": 17.2400, "longitude": 78.4300}},  # Shamshabad
    # POTATO (MSP >= 6)
    {"crop": "Potato", "quantity": 2000, "price": 10, "location": {"latitude": 17.4500, "longitude": 78.3800}},  # JNTU
    {"crop": "Potato", "quantity": 400,  "price": 14, "location": {"latitude": 17.3300, "longitude": 78.5200}},  # Dilsukhnagar
    {"crop": "Potato", "quantity": 750,  "price": 18, "location": {"latitude": 17.5000, "longitude": 78.5500}},  # Uppal
]

print(f"Uploading {len(listings)} farmer listings...\n")
for i, l in enumerate(listings, 1):
    d = post(API, l)
    lid = d.get("listing_id", "?")[:8]
    loc = l["location"]
    print(f"  [{i:2d}] {l['crop']:6s}  qty={l['quantity']:5.0f}kg  price=Rs{l['price']:3.0f}/kg  loc=({loc['latitude']:.4f},{loc['longitude']:.4f})  -> {lid}...")
    time.sleep(0.5)

print("\nDone! Waiting 2s for HNSW indexing...")
time.sleep(2)
print("All listings indexed.")
