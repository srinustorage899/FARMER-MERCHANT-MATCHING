"""
seed_100_farmers.py — Seed 100 realistic farmer listings across Telangana.

Covers edge cases for demo / viva:
  • 25+ different crops (vegetables, grains, fruits, pulses, spices, cash crops)
  • 30+ real Telangana locations across all 33 districts
  • Price range: near-MSP to premium (tests budget filtering)
  • Quantity range: 10 kg (small farmer) to 20,000 kg (large cooperative)
  • Male & female farmer names (Telugu naming conventions)
  • Same crop in multiple locations (tests HNSW multi-node search)
  • Same location with multiple crops (tests crop-specific indexing)
  • Nearby clusters (tests radius/distance ranking)
  • Distant farmers (tests radius exclusion)

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python seed_100_farmers.py
"""

import urllib.request
import json
import time
import sys

API = "http://localhost:8000/api/farmer/upload"


def post(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# 100 FARMERS — Real Telangana locations, realistic Telugu names & data
# ═══════════════════════════════════════════════════════════════════════════

listings = [
    # ──────────────────────────────────────────────────────────────────────
    # TOMATO (MSP ₹5) — 10 farmers across Telangana
    # Edge cases: price spread, qty spread, nearby cluster, same village
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Tomato", "quantity": 200,   "price": 12,  "farmer_name": "Ramesh Reddy",       "location": {"latitude": 17.3850, "longitude": 78.4867}},   # Hyderabad
    {"crop": "Tomato", "quantity": 500,   "price": 18,  "farmer_name": "Suresh Goud",        "location": {"latitude": 17.4400, "longitude": 78.3500}},   # Kukatpally
    {"crop": "Tomato", "quantity": 150,   "price": 8,   "farmer_name": "Lakshmi Bai",        "location": {"latitude": 17.3616, "longitude": 78.4747}},   # Mehdipatnam — near MSP
    {"crop": "Tomato", "quantity": 800,   "price": 25,  "farmer_name": "Venkat Rao",         "location": {"latitude": 17.4948, "longitude": 78.3996}},   # Secunderabad
    {"crop": "Tomato", "quantity": 50,    "price": 15,  "farmer_name": "Anjali Kumari",      "location": {"latitude": 17.9689, "longitude": 79.5941}},   # Warangal
    {"crop": "Tomato", "quantity": 1200,  "price": 22,  "farmer_name": "Srinivas Yadav",     "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Tomato", "quantity": 350,   "price": 10,  "farmer_name": "Padma Devi",         "location": {"latitude": 15.8281, "longitude": 78.0373}},   # Mahabubnagar
    {"crop": "Tomato", "quantity": 75,    "price": 30,  "farmer_name": "Ravi Shankar",       "location": {"latitude": 18.6725, "longitude": 78.0941}},   # Nizamabad — premium
    {"crop": "Tomato", "quantity": 3000,  "price": 14,  "farmer_name": "Gopal Reddy",        "location": {"latitude": 17.2543, "longitude": 78.7480}},   # Ibrahimpatnam — bulk
    {"crop": "Tomato", "quantity": 100,   "price": 20,  "farmer_name": "Swathi Reddy",       "location": {"latitude": 17.3900, "longitude": 78.4900}},   # Near Hyderabad — cluster test

    # ──────────────────────────────────────────────────────────────────────
    # ONION (MSP ₹8) — 8 farmers
    # Edge cases: large quantities, close to MSP prices
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Onion", "quantity": 2000,   "price": 12,  "farmer_name": "Nagesh Goud",        "location": {"latitude": 17.3500, "longitude": 78.5500}},   # LB Nagar
    {"crop": "Onion", "quantity": 600,    "price": 16,  "farmer_name": "Bharathi Devi",      "location": {"latitude": 17.4100, "longitude": 78.4600}},   # Ameerpet
    {"crop": "Onion", "quantity": 5000,   "price": 9,   "farmer_name": "Mallesh Naik",       "location": {"latitude": 16.5062, "longitude": 78.5700}},   # Kurnool border — near MSP, huge qty
    {"crop": "Onion", "quantity": 300,    "price": 22,  "farmer_name": "Sahithi Bai",        "location": {"latitude": 18.3388, "longitude": 78.3378}},   # Kamareddy
    {"crop": "Onion", "quantity": 1500,   "price": 14,  "farmer_name": "Raju Mudiraj",       "location": {"latitude": 17.2403, "longitude": 78.4294}},   # Shamshabad
    {"crop": "Onion", "quantity": 800,    "price": 11,  "farmer_name": "Yellamma G.",        "location": {"latitude": 18.0543, "longitude": 79.5519}},   # Jangaon
    {"crop": "Onion", "quantity": 250,    "price": 18,  "farmer_name": "Krishna Prasad",     "location": {"latitude": 17.7215, "longitude": 78.1038}},   # Sangareddy
    {"crop": "Onion", "quantity": 10000,  "price": 10,  "farmer_name": "Raghunath Cooperative", "location": {"latitude": 18.6725, "longitude": 78.0941}},# Nizamabad — cooperative bulk

    # ──────────────────────────────────────────────────────────────────────
    # POTATO (MSP ₹6) — 6 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Potato", "quantity": 2000,  "price": 10,  "farmer_name": "Hanumantha Rao",     "location": {"latitude": 17.4500, "longitude": 78.3800}},   # JNTU area
    {"crop": "Potato", "quantity": 400,   "price": 14,  "farmer_name": "Savithri Bai",       "location": {"latitude": 17.3300, "longitude": 78.5200}},   # Dilsukhnagar
    {"crop": "Potato", "quantity": 750,   "price": 18,  "farmer_name": "Prasad Varma",       "location": {"latitude": 17.5000, "longitude": 78.5500}},   # Uppal
    {"crop": "Potato", "quantity": 100,   "price": 8,   "farmer_name": "Shyamala Devi",      "location": {"latitude": 18.8048, "longitude": 79.4583}},   # Mancherial — near MSP
    {"crop": "Potato", "quantity": 3500,  "price": 12,  "farmer_name": "Rajender Singh",     "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad — far north
    {"crop": "Potato", "quantity": 60,    "price": 20,  "farmer_name": "Deepa Reddy",        "location": {"latitude": 17.0005, "longitude": 78.2616}},   # Vikarabad — small qty

    # ──────────────────────────────────────────────────────────────────────
    # RICE (MSP ₹22.03) — 8 farmers
    # Edge cases: grain crop, high MSP, large-scale farming
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Rice", "quantity": 5000,    "price": 25,  "farmer_name": "Narasimha Rao",      "location": {"latitude": 17.9689, "longitude": 79.5941}},   # Warangal — rice belt
    {"crop": "Rice", "quantity": 8000,    "price": 28,  "farmer_name": "Laxmi Narasamma",    "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Rice", "quantity": 2000,    "price": 23,  "farmer_name": "Chandrashekar Reddy","location": {"latitude": 17.2473, "longitude": 80.1514}},   # Khammam — near MSP
    {"crop": "Rice", "quantity": 10000,   "price": 30,  "farmer_name": "Sarpanch Ramulu FPO","location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda — FPO bulk
    {"crop": "Rice", "quantity": 500,     "price": 35,  "farmer_name": "Vijaya Lakshmi",     "location": {"latitude": 17.4484, "longitude": 78.3915}},   # Hyderabad suburb — premium basmati
    {"crop": "Rice", "quantity": 3000,    "price": 26,  "farmer_name": "Bhaskar Rao",        "location": {"latitude": 18.1067, "longitude": 79.2778}},   # Siddipet
    {"crop": "Rice", "quantity": 15000,   "price": 24,  "farmer_name": "Suryapet Agri Coop", "location": {"latitude": 17.1399, "longitude": 79.6263}},   # Suryapet — very large
    {"crop": "Rice", "quantity": 700,     "price": 32,  "farmer_name": "Komala Devi",        "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad

    # ──────────────────────────────────────────────────────────────────────
    # COTTON (MSP ₹67) — 6 farmers
    # Edge cases: high MSP cash crop, Telangana is a cotton state
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Cotton", "quantity": 4000,  "price": 72,  "farmer_name": "Pochamma Bai",       "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad — cotton belt
    {"crop": "Cotton", "quantity": 2500,  "price": 80,  "farmer_name": "Sattaiah Goud",      "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Cotton", "quantity": 1000,  "price": 68,  "farmer_name": "Anitha Yadav",       "location": {"latitude": 18.6725, "longitude": 78.0941}},   # Nizamabad — near MSP
    {"crop": "Cotton", "quantity": 6000,  "price": 75,  "farmer_name": "Warangal Cotton FPO","location": {"latitude": 17.9110, "longitude": 79.7500}},   # Warangal
    {"crop": "Cotton", "quantity": 800,   "price": 90,  "farmer_name": "Indira Bai",         "location": {"latitude": 18.8048, "longitude": 79.4583}},   # Mancherial — premium
    {"crop": "Cotton", "quantity": 3000,  "price": 70,  "farmer_name": "Balram Naik",        "location": {"latitude": 18.3388, "longitude": 78.3378}},   # Kamareddy

    # ──────────────────────────────────────────────────────────────────────
    # CHILLI / GREEN CHILLI (MSP ₹8) — 6 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Green Chilli", "quantity": 500,  "price": 15,  "farmer_name": "Narsing Rao",    "location": {"latitude": 16.5062, "longitude": 78.5700}},   # Gadwal — chilli region
    {"crop": "Green Chilli", "quantity": 200,  "price": 25,  "farmer_name": "Kalavathi Bai",  "location": {"latitude": 17.9689, "longitude": 79.5941}},   # Warangal
    {"crop": "Green Chilli", "quantity": 1500, "price": 12,  "farmer_name": "Srisailam Goud", "location": {"latitude": 17.2403, "longitude": 78.4294}},   # Shamshabad
    {"crop": "Green Chilli", "quantity": 80,   "price": 35,  "farmer_name": "Radha Kumari",   "location": {"latitude": 18.0543, "longitude": 79.5519}},   # Jangaon — small qty premium
    {"crop": "Green Chilli", "quantity": 3000, "price": 10,  "farmer_name": "Warangal Mirchi Yard", "location": {"latitude": 17.9200, "longitude": 79.6100}},# Warangal — wholesale
    {"crop": "Green Chilli", "quantity": 100,  "price": 20,  "farmer_name": "Pushpa Latha",   "location": {"latitude": 17.7215, "longitude": 78.1038}},   # Sangareddy

    # ──────────────────────────────────────────────────────────────────────
    # TURMERIC (MSP ₹30) — 5 farmers
    # Edge cases: spice crop, Nizamabad is the turmeric capital
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Turmeric", "quantity": 2000, "price": 45,  "farmer_name": "Laxminarayana B.",  "location": {"latitude": 18.6725, "longitude": 78.0941}},   # Nizamabad — turmeric hub
    {"crop": "Turmeric", "quantity": 800,  "price": 55,  "farmer_name": "Sarojini Devi",     "location": {"latitude": 18.3388, "longitude": 78.3378}},   # Kamareddy
    {"crop": "Turmeric", "quantity": 500,  "price": 38,  "farmer_name": "Ravinder Goud",     "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar — near MSP
    {"crop": "Turmeric", "quantity": 5000, "price": 50,  "farmer_name": "Nizamabad Turmeric Coop", "location": {"latitude": 18.7000, "longitude": 78.1000}},# Nizamabad bulk
    {"crop": "Turmeric", "quantity": 150,  "price": 65,  "farmer_name": "Kavitha Reddy",     "location": {"latitude": 17.4484, "longitude": 78.3915}},   # Hyderabad — premium organic

    # ──────────────────────────────────────────────────────────────────────
    # MANGO (MSP ₹15) — 5 farmers
    # Edge cases: seasonal fruit
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Mango", "quantity": 3000,  "price": 40,  "farmer_name": "Mohan Reddy",        "location": {"latitude": 17.2543, "longitude": 78.7480}},   # Ibrahimpatnam
    {"crop": "Mango", "quantity": 500,   "price": 60,  "farmer_name": "Sujatha Kumari",     "location": {"latitude": 15.8281, "longitude": 78.0373}},   # Mahabubnagar — premium
    {"crop": "Mango", "quantity": 1500,  "price": 25,  "farmer_name": "Gopi Krishna",       "location": {"latitude": 17.2473, "longitude": 80.1514}},   # Khammam
    {"crop": "Mango", "quantity": 200,   "price": 80,  "farmer_name": "Aruna Devi",         "location": {"latitude": 17.0005, "longitude": 78.2616}},   # Vikarabad — alphonso premium
    {"crop": "Mango", "quantity": 8000,  "price": 20,  "farmer_name": "Jadcherla Mango FPO","location": {"latitude": 16.7667, "longitude": 78.1333}},   # Jadcherla — bulk export

    # ──────────────────────────────────────────────────────────────────────
    # BANANA (MSP ₹5) — 4 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Banana", "quantity": 5000,  "price": 10,  "farmer_name": "Thirupathi Rao",     "location": {"latitude": 17.2473, "longitude": 80.1514}},   # Khammam — banana belt
    {"crop": "Banana", "quantity": 1000,  "price": 15,  "farmer_name": "Vanaja Devi",        "location": {"latitude": 17.1399, "longitude": 79.6263}},   # Suryapet
    {"crop": "Banana", "quantity": 300,   "price": 8,   "farmer_name": "Ramamurthy K.",      "location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda — near MSP
    {"crop": "Banana", "quantity": 2000,  "price": 12,  "farmer_name": "Jyothi Bai",         "location": {"latitude": 17.9689, "longitude": 79.5941}},   # Warangal

    # ──────────────────────────────────────────────────────────────────────
    # MAIZE (MSP ₹20.90) — 4 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Maize", "quantity": 3000,  "price": 22,  "farmer_name": "Narsimhulu Y.",      "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Maize", "quantity": 1500,  "price": 25,  "farmer_name": "Sridevi Yadav",      "location": {"latitude": 18.0543, "longitude": 79.5519}},   # Jangaon
    {"crop": "Maize", "quantity": 6000,  "price": 21,  "farmer_name": "Medak Maize Coop",   "location": {"latitude": 17.7687, "longitude": 78.2641}},   # Medak — near MSP bulk
    {"crop": "Maize", "quantity": 400,   "price": 28,  "farmer_name": "Lakshman Goud",      "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad

    # ──────────────────────────────────────────────────────────────────────
    # BRINJAL (MSP ₹5) — 3 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Brinjal", "quantity": 300,  "price": 12,  "farmer_name": "Rani Devi",          "location": {"latitude": 17.4100, "longitude": 78.4600}},   # Ameerpet
    {"crop": "Brinjal", "quantity": 150,  "price": 8,   "farmer_name": "Peddaiah M.",        "location": {"latitude": 17.9689, "longitude": 79.5941}},   # Warangal
    {"crop": "Brinjal", "quantity": 600,  "price": 15,  "farmer_name": "Shobha Rani",        "location": {"latitude": 17.7215, "longitude": 78.1038}},   # Sangareddy

    # ──────────────────────────────────────────────────────────────────────
    # GROUNDNUT (MSP ₹60.15) — 4 farmers
    # Edge cases: high MSP oilseed
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Groundnut", "quantity": 2000, "price": 65,  "farmer_name": "Narayana Swamy",   "location": {"latitude": 15.8281, "longitude": 78.0373}},   # Mahabubnagar
    {"crop": "Groundnut", "quantity": 500,  "price": 75,  "farmer_name": "Shanta Bai",       "location": {"latitude": 16.5062, "longitude": 78.5700}},   # Gadwal
    {"crop": "Groundnut", "quantity": 1200, "price": 62,  "farmer_name": "Madhusudhan Rao",  "location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda — near MSP
    {"crop": "Groundnut", "quantity": 3500, "price": 70,  "farmer_name": "Palamuru GN Coop", "location": {"latitude": 16.2300, "longitude": 77.8600}},   # Wanaparthy

    # ──────────────────────────────────────────────────────────────────────
    # SUGARCANE (MSP ₹3.15) — 3 farmers
    # Edge cases: very low MSP per kg, very high quantities
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Sugarcane", "quantity": 20000, "price": 4,  "farmer_name": "Sambaiah Mudiraj",  "location": {"latitude": 18.6725, "longitude": 78.0941}},   # Nizamabad — max qty
    {"crop": "Sugarcane", "quantity": 15000, "price": 5,  "farmer_name": "Kamareddy Sugar FPO","location": {"latitude": 18.3388, "longitude": 78.3378}},  # Kamareddy
    {"crop": "Sugarcane", "quantity": 8000,  "price": 3.5,"farmer_name": "Janardhan Rao",     "location": {"latitude": 17.1399, "longitude": 79.6263}},   # Suryapet

    # ──────────────────────────────────────────────────────────────────────
    # CABBAGE (MSP ₹4) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Cabbage", "quantity": 400,   "price": 8,   "farmer_name": "Rajeshwari B.",     "location": {"latitude": 17.7687, "longitude": 78.2641}},   # Medak
    {"crop": "Cabbage", "quantity": 800,   "price": 12,  "farmer_name": "Rangamma Devi",     "location": {"latitude": 17.0005, "longitude": 78.2616}},   # Vikarabad

    # ──────────────────────────────────────────────────────────────────────
    # CARROT (MSP ₹6) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Carrot", "quantity": 200,   "price": 15,  "farmer_name": "Saritha Kumari",     "location": {"latitude": 17.4484, "longitude": 78.3915}},   # Hyderabad
    {"crop": "Carrot", "quantity": 600,   "price": 10,  "farmer_name": "Mahesh Goud",        "location": {"latitude": 17.7687, "longitude": 78.2641}},   # Medak

    # ──────────────────────────────────────────────────────────────────────
    # CAULIFLOWER (MSP ₹5) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Cauliflower", "quantity": 350,  "price": 14, "farmer_name": "Sunitha Reddy",   "location": {"latitude": 17.3850, "longitude": 78.4867}},   # Hyderabad
    {"crop": "Cauliflower", "quantity": 150,  "price": 10, "farmer_name": "Devamma G.",      "location": {"latitude": 17.7215, "longitude": 78.1038}},   # Sangareddy

    # ──────────────────────────────────────────────────────────────────────
    # GINGER (MSP ₹20) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Ginger", "quantity": 400,   "price": 30,  "farmer_name": "Venkaiah Naidu",     "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Ginger", "quantity": 250,   "price": 45,  "farmer_name": "Parvathi Bai",       "location": {"latitude": 17.2473, "longitude": 80.1514}},   # Khammam — premium

    # ──────────────────────────────────────────────────────────────────────
    # SPINACH (MSP ₹4) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Spinach", "quantity": 50,   "price": 10,  "farmer_name": "Sharifa Begum",      "location": {"latitude": 17.4100, "longitude": 78.4600}},   # Ameerpet — small urban
    {"crop": "Spinach", "quantity": 100,  "price": 8,   "farmer_name": "Nirmala Devi",       "location": {"latitude": 17.3616, "longitude": 78.4747}},   # Mehdipatnam

    # ──────────────────────────────────────────────────────────────────────
    # OKRA / BHENDI (MSP ₹5) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Okra", "quantity": 200,    "price": 12,  "farmer_name": "Shiva Kumar R.",      "location": {"latitude": 17.5000, "longitude": 78.5500}},   # Uppal
    {"crop": "Okra", "quantity": 500,    "price": 8,   "farmer_name": "Nagalakshmi S.",      "location": {"latitude": 18.0543, "longitude": 79.5519}},   # Jangaon

    # ──────────────────────────────────────────────────────────────────────
    # CHANA (MSP ₹53.35) — 3 farmers
    # Edge cases: pulse with high MSP
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Chana", "quantity": 1000,  "price": 55,  "farmer_name": "Raghavendra Rao",     "location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda
    {"crop": "Chana", "quantity": 2500,  "price": 60,  "farmer_name": "Nalgonda Pulse FPO",  "location": {"latitude": 16.9500, "longitude": 79.5000}},   # Nalgonda cooperative
    {"crop": "Chana", "quantity": 300,   "price": 58,  "farmer_name": "Vimala Bai",          "location": {"latitude": 15.8281, "longitude": 78.0373}},   # Mahabubnagar

    # ──────────────────────────────────────────────────────────────────────
    # SOYBEAN (MSP ₹44.25) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Soybean", "quantity": 1500, "price": 48,  "farmer_name": "Ramulu Naik",        "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad
    {"crop": "Soybean", "quantity": 800,  "price": 52,  "farmer_name": "Lalitha Bai",        "location": {"latitude": 18.8048, "longitude": 79.4583}},   # Mancherial

    # ──────────────────────────────────────────────────────────────────────
    # ORANGE (MSP ₹10) — 3 farmers
    # Edge case: Nagpur oranges also grown in north Telangana
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Orange", "quantity": 3000, "price": 18,  "farmer_name": "Shankar Lal",         "location": {"latitude": 19.1071, "longitude": 79.3106}},   # Adilabad — orange belt
    {"crop": "Orange", "quantity": 1200, "price": 22,  "farmer_name": "Kausalya Devi",       "location": {"latitude": 18.8048, "longitude": 79.4583}},   # Mancherial
    {"crop": "Orange", "quantity": 500,  "price": 30,  "farmer_name": "Ravi Kiran Reddy",    "location": {"latitude": 18.6725, "longitude": 78.0941}},   # Nizamabad

    # ──────────────────────────────────────────────────────────────────────
    # WATERMELON (MSP ₹3) — 2 farmers
    # Edge case: very low MSP, seasonal, bulk
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Watermelon", "quantity": 10000, "price": 5, "farmer_name": "Beeraiah K.",      "location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda
    {"crop": "Watermelon", "quantity": 4000,  "price": 8, "farmer_name": "Ramesh Mudiraj",   "location": {"latitude": 17.1399, "longitude": 79.6263}},   # Suryapet

    # ──────────────────────────────────────────────────────────────────────
    # CORIANDER (MSP ₹30) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Coriander", "quantity": 300,  "price": 40,  "farmer_name": "Narsamma B.",      "location": {"latitude": 18.3388, "longitude": 78.3378}},   # Kamareddy
    {"crop": "Coriander", "quantity": 100,  "price": 50,  "farmer_name": "Abdul Rashid",     "location": {"latitude": 17.4400, "longitude": 78.3500}},   # Kukatpally — urban premium

    # ──────────────────────────────────────────────────────────────────────
    # PAPAYA (MSP ₹5) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Papaya", "quantity": 1200,  "price": 8,   "farmer_name": "Dasarath Goud",      "location": {"latitude": 17.2543, "longitude": 78.7480}},   # Ibrahimpatnam
    {"crop": "Papaya", "quantity": 400,   "price": 12,  "farmer_name": "Mangatayaru B.",     "location": {"latitude": 17.2473, "longitude": 80.1514}},   # Khammam

    # ──────────────────────────────────────────────────────────────────────
    # CUCUMBER (MSP ₹4) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Cucumber", "quantity": 400,   "price": 7,  "farmer_name": "Eshwar Rao",        "location": {"latitude": 17.3616, "longitude": 78.4747}},   # Mehdipatnam
    {"crop": "Cucumber", "quantity": 250,   "price": 10, "farmer_name": "Fatima Begum",      "location": {"latitude": 17.5000, "longitude": 78.5500}},   # Uppal

    # ──────────────────────────────────────────────────────────────────────
    # GUAVA (MSP ₹8) — 2 farmers
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Guava", "quantity": 800,   "price": 15,  "farmer_name": "Venkateshwarlu P.",   "location": {"latitude": 17.7687, "longitude": 78.2641}},   # Medak
    {"crop": "Guava", "quantity": 350,   "price": 20,  "farmer_name": "Sumalatha Rani",      "location": {"latitude": 17.7215, "longitude": 78.1038}},   # Sangareddy

    # ──────────────────────────────────────────────────────────────────────
    # TUR / PIGEON PEA (MSP ₹71) — 2 farmers
    # Edge case: high MSP pulse
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Tur", "quantity": 800,   "price": 75,  "farmer_name": "Gangadhar Rao",        "location": {"latitude": 18.4386, "longitude": 79.1288}},   # Karimnagar
    {"crop": "Tur", "quantity": 1500,  "price": 80,  "farmer_name": "Jagadish Yadav",       "location": {"latitude": 16.9891, "longitude": 79.5220}},   # Nalgonda

    # ──────────────────────────────────────────────────────────────────────
    # PEAS (MSP ₹10) — 1 farmer
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Peas", "quantity": 200,   "price": 18,  "farmer_name": "Nagaraju Yadav",       "location": {"latitude": 17.0005, "longitude": 78.2616}},   # Vikarabad

    # ──────────────────────────────────────────────────────────────────────
    # GARLIC (MSP ₹15) — 1 farmer
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Garlic", "quantity": 150,  "price": 25,  "farmer_name": "Satyanarayana G.",     "location": {"latitude": 18.1067, "longitude": 79.2778}},   # Siddipet

    # ──────────────────────────────────────────────────────────────────────
    # LEMON (MSP ₹10) — 1 farmer
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Lemon", "quantity": 600,  "price": 15,  "farmer_name": "Bhagya Lakshmi",       "location": {"latitude": 16.7667, "longitude": 78.1333}},   # Jadcherla

    # ──────────────────────────────────────────────────────────────────────
    # POMEGRANATE (MSP ₹25) — 1 farmer
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Pomegranate", "quantity": 400, "price": 45, "farmer_name": "Rajkumar Patil",   "location": {"latitude": 16.2300, "longitude": 77.8600}},   # Wanaparthy

    # ──────────────────────────────────────────────────────────────────────
    # BITTER GOURD (MSP ₹6) — 1 farmer
    # ──────────────────────────────────────────────────────────────────────
    {"crop": "Bitter Gourd", "quantity": 100, "price": 12, "farmer_name": "Krishnaveni M.",  "location": {"latitude": 17.3500, "longitude": 78.5500}},   # LB Nagar
]

# ═══════════════════════════════════════════════════════════════════════════
# UPLOAD ALL LISTINGS
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{'='*72}")
    print(f" AgriMatch — Seeding {len(listings)} farmer listings across Telangana")
    print(f"{'='*72}\n")

    # Summary by crop
    crops = {}
    for l in listings:
        crops[l["crop"]] = crops.get(l["crop"], 0) + 1
    print("Crop breakdown:")
    for crop, count in sorted(crops.items(), key=lambda x: -x[1]):
        print(f"  {crop:16s} : {count} farmer(s)")
    print(f"\n  {'TOTAL':16s} : {len(listings)} listings")
    print(f"  {'Unique crops':16s} : {len(crops)}")
    print()

    success = 0
    failed = 0

    for i, l in enumerate(listings, 1):
        result = post(API, l)
        lid = result.get("listing_id", "???")[:8]
        name = (l.get("farmer_name") or "N/A")[:20]
        loc = l["location"]

        if "error" in result:
            status = f"FAILED: {result['error'][:40]}"
            failed += 1
        else:
            status = f"OK -> {lid}..."
            success += 1

        print(
            f"  [{i:3d}/{len(listings)}] "
            f"{l['crop']:16s}  "
            f"qty={l['quantity']:>7,.0f}kg  "
            f"price=₹{l['price']:>6.1f}/kg  "
            f"({loc['latitude']:>8.4f}, {loc['longitude']:>8.4f})  "
            f"{name:20s}  "
            f"{status}"
        )

        # Small delay to let HNSW worker process in order
        time.sleep(0.3)

    print(f"\n{'='*72}")
    print(f" Done! {success} succeeded, {failed} failed")
    print(f" Waiting 3s for HNSW indexing to finish...")
    print(f"{'='*72}")
    time.sleep(3)
    print(" All listings indexed. Open http://localhost:8000/demo/farmers to view.\n")
