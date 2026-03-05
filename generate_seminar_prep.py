"""
Generate a PDF of the complete seminar preparation material.
"""
from fpdf import FPDF

class SeminarPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "PID-36 | Farmer-Merchant Matching Platform (HNSW) - Seminar Preparation", align="C")
        self.ln(4)
        self.set_draw_color(0, 102, 204)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(0, 51, 102)
        self.cell(0, 12, title)
        self.ln(8)
        self.set_draw_color(0, 102, 204)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 120, self.get_y())
        self.ln(6)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(0, 80, 140)
        self.cell(0, 10, title)
        self.ln(8)

    def sub_sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title)
        self.ln(6)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, indent=10):
        x = self.get_x()
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.cell(indent)
        self.cell(5, 5.5, "-")
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bold_bullet(self, bold_part, rest, indent=10):
        x = self.get_x()
        self.cell(indent)
        self.cell(5, 5.5, "-")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        w = self.get_string_width(bold_part) + 1
        self.cell(w, 5.5, bold_part)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 5.5, rest)
        self.ln(1)

    def qa_block(self, question, answer):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(0, 80, 140)
        self.multi_cell(0, 5.5, question)
        self.ln(1)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, answer)
        self.ln(4)

    def table_row(self, col1, col2, bold=False):
        self.set_font("Helvetica", "B" if bold else "", 9)
        if bold:
            self.set_fill_color(0, 80, 140)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(240, 245, 250)
            self.set_text_color(30, 30, 30)
        self.cell(60, 7, col1, border=1, fill=True)
        self.cell(0, 7, col2, border=1, fill=not bold)
        self.ln()

    def table_row3(self, col1, col2, col3, bold=False):
        self.set_font("Helvetica", "B" if bold else "", 9)
        if bold:
            self.set_fill_color(0, 80, 140)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(240, 245, 250)
            self.set_text_color(30, 30, 30)
        self.cell(45, 7, col1, border=1, fill=True)
        self.cell(55, 7, col2, border=1, fill=not bold)
        self.cell(0, 7, col3, border=1, fill=not bold)
        self.ln()

    def check_page_break(self, h=40):
        if self.get_y() + h > 270:
            self.add_page()


pdf = SeminarPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

#                                                                
# COVER PAGE
#                                                                
pdf.add_page()
pdf.ln(40)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(0, 51, 102)
pdf.cell(0, 15, "Seminar Preparation Guide", align="C")
pdf.ln(18)
pdf.set_font("Helvetica", "", 16)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 10, "PID-36", align="C")
pdf.ln(12)
pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(0, 80, 140)
pdf.multi_cell(0, 8, "Farmer-Merchant Matching Platform\nUsing Hierarchical Navigable Small World (HNSW) Graphs", align="C")
pdf.ln(15)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(60, 60, 60)
pdf.cell(0, 8, "160122733302 - Endravath Krishna", align="C")
pdf.ln(8)
pdf.cell(0, 8, "160122733305 - Potharaju Srinivas", align="C")
pdf.ln(12)
pdf.cell(0, 8, "Supervisor: Dr. M Swamy Das", align="C")
pdf.ln(20)
pdf.set_draw_color(0, 102, 204)
pdf.set_line_width(1)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(10)
pdf.set_font("Helvetica", "I", 10)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 8, "Review 2 - Major Project", align="C")

#                                                                
# SECTION 1: PROJECT OVERVIEW
#                                                                
pdf.add_page()
pdf.section_title("1. PROJECT OVERVIEW")

pdf.sub_title("What is AgriMatch?")
pdf.body_text(
    "AgriMatch is a platform that directly connects farmers with merchants - cutting out middlemen "
    "who eat into farmer profits. It uses HNSW (Hierarchical Navigable Small World) graphs for "
    "intelligent, fast matching based on location, price, quantity, and crop type."
)

pdf.sub_title("The Core Problem")
pdf.bullet("Farmers in India lose 20-30% of revenue to middlemen who control pricing and market access")
pdf.bullet("Existing tech solutions use slow algorithms: KNN (O(N) linear search) or K-Means (batch clustering, no real-time updates)")
pdf.bullet("No system ensures MSP (Minimum Support Price) compliance programmatically")

pdf.sub_title("Our Solution")
pdf.bullet("HNSW graph provides O(log N) approximate nearest-neighbour search")
pdf.bullet("Instant incremental inserts - no need to rebuild the entire index when a farmer uploads")
pdf.bullet("Two-phase search: fast ANN (top-50) followed by exact Haversine reranking (top-5)")
pdf.bullet("MSP enforcement - rejects listings below government minimum price")
pdf.bullet("Async architecture - Redis queue decouples API response from HNSW indexing")

pdf.sub_title("In Simple Terms")
pdf.body_text(
    'Think of it as a "Swiggy for crops" - but instead of matching food with customers, it matches '
    "farmers with merchants using AI-powered vector similarity search, ensuring fair pricing and "
    "geographic proximity."
)

#                                                                
# SECTION 2: ARCHITECTURE
#                                                                
pdf.add_page()
pdf.section_title("2. ARCHITECTURE (Every Component Explained)")

pdf.sub_title("2.1 USERS")
pdf.body_text("Two types of users:")
pdf.bold_bullet("Merchant: ", "Register/Login, Search for crops, Place Orders, View Map. They are the buyers.")
pdf.bold_bullet("Farmer: ", "Register/Login, Upload Crop listings, View Dashboard. They are the sellers.")
pdf.body_text("Both interact with the system through REST API calls (standard HTTP requests).")

pdf.check_page_break()
pdf.sub_title("2.2 FRONTEND - React + Vite")
pdf.bullet("The website users see and interact with - buttons, forms, dashboards")
pdf.bullet("Built with React (JavaScript UI library) and Vite (fast build tool)")
pdf.bullet("Sends REST API requests to the backend whenever a user does something")
pdf.bullet("Does NOT do any smart logic - just displays data and sends inputs to backend")

pdf.check_page_break()
pdf.sub_title("2.3 BACKEND (FastAPI + Python)")
pdf.body_text("The brain of the entire system. Contains multiple components:")

pdf.check_page_break()
pdf.sub_sub_title("a) Farmer API")
pdf.bullet("Handles farmer requests - specifically uploading crop listings")
pdf.bullet("Saves listing to MongoDB, pushes listing ID into Redis Queue")
pdf.bullet("Returns instantly - farmer doesn't wait for HNSW indexing")

pdf.check_page_break()
pdf.sub_sub_title("b) Background Worker")
pdf.bullet("A separate thread running silently in the background")
pdf.bullet("Watches Redis Queue - picks up new listing IDs via BRPOP (blocking pop)")
pdf.bullet("Fetches full details from MongoDB, runs MSP validation")
pdf.bullet("Encodes listing into vector, inserts into HNSW index")
pdf.bullet("Asynchronous - happens in background, never blocks users")

pdf.check_page_break()
pdf.sub_sub_title("c) MSP Validation")
pdf.bullet("MSP = Minimum Support Price set by Indian Government")
pdf.bullet("Checks: Is the farmer charging at least the government minimum?")
pdf.bullet("If price < MSP, listing is rejected (protects farmers from exploitation)")
pdf.bullet("Has prices for 50+ crops stored in memory")

pdf.check_page_break()
pdf.sub_sub_title("d) HNSW Index Service")
pdf.bullet("Manages the HNSW graph indices - one separate index per crop")
pdf.bullet("Like a librarian who organizes listings so you can find them instantly")
pdf.bullet("Inserts vectors into the correct crop's index")
pdf.bullet("Saves indices to disk as .hnsw files for persistence across restarts")

pdf.check_page_break()
pdf.sub_sub_title("e) Feature Engineering")
pdf.bullet("The translator - converts human-readable data into 54-dimensional vectors")
pdf.bullet("Takes: crop name, price, quantity, latitude, longitude")
pdf.bullet("Produces: [lat_norm, lon_norm, price_norm, qty_norm, crop_one_hot(50)]")
pdf.bullet("All values normalized to [0,1] so no single feature dominates")
pdf.bullet("Also contains Haversine formula for exact Earth-surface distance")

pdf.check_page_break()
pdf.sub_sub_title("f) Merchant Search API")
pdf.bullet("Handles merchant search requests")
pdf.bullet("Receives the request and passes it to the Vector Service")
pdf.bullet("Returns final ranked results back to the frontend")

pdf.check_page_break()
pdf.sub_sub_title("g) Query Encoding")
pdf.bullet("Same as Feature Engineering but for the merchant's search query")
pdf.bullet("Converts requirements into the same 54-D vector space as farmer listings")
pdf.bullet("Enables HNSW to compare merchant query vs farmer listings (apples to apples)")

pdf.check_page_break()
pdf.sub_sub_title("h) HNSW ANN Search (hnswlib)")
pdf.bullet("ANN = Approximate Nearest Neighbour - the actual search engine")
pdf.bullet("Uses hnswlib C++ library for maximum speed")
pdf.bullet("Takes query vector, finds top 50 closest farmer vectors in O(log N) time")
pdf.bullet("Even with 100,000 listings, takes < 1 millisecond")

pdf.check_page_break()
pdf.sub_sub_title("i) Composite Rerank")
pdf.bullet("The final judge - takes 50 approximate results and picks the best 5")
pdf.bullet("Filters out inactive listings, MSP violators, over-budget prices")
pdf.bullet("Computes exact Haversine distance (not approximated)")
pdf.bullet("Scores each result: 60% distance weight + 40% price weight")
pdf.bullet("Returns top 5 lowest-scoring (best) matches")

pdf.check_page_break()
pdf.sub_sub_title("j) Vector Service (CORE)")
pdf.bullet("The orchestrator that ties everything together for a search")
pdf.bullet("Coordinates: Query Encoding -> HNSW Search -> MongoDB Fetch -> Filtering -> Reranking")
pdf.bullet("Think of it as the manager that delegates work to all specialists")

pdf.check_page_break()
pdf.sub_title("2.4 DATA LAYER")

pdf.sub_sub_title("a) MongoDB (Docker)")
pdf.bullet("Main database - stores all crop listings as JSON documents")
pdf.bullet("Each listing: listing_id, crop, price, quantity, location, farmer_name, active, timestamp")
pdf.bullet("Runs in a Docker container (isolated, portable)")

pdf.sub_sub_title("b) Redis Queue (Docker)")
pdf.bullet("Message queue - acts like a conveyor belt between API and background worker")
pdf.bullet("Farmer API does LPUSH (enqueue), Worker does BRPOP (dequeue) - FIFO order")
pdf.bullet("Decouples fast API response from slow HNSW indexing")

pdf.sub_sub_title("c) HNSW Index Files (.hnsw)")
pdf.bullet("Binary files on disk - the actual HNSW graph data")
pdf.bullet("One .hnsw file + one .meta.json file per crop")
pdf.bullet(".meta.json stores mapping between internal HNSW IDs and listing UUIDs")
pdf.bullet("Loaded into memory on startup, saved to disk on shutdown")

pdf.check_page_break()
pdf.sub_title("2.5 HNSW 3D Visualization")
pdf.bullet("Bonus feature - a web page that visually shows HNSW graph traversal")
pdf.bullet("After each search, stores traversal data for visualization")
pdf.bullet("Useful for demonstrating how HNSW works in the seminar")

pdf.check_page_break()
pdf.sub_title("2.6 Data Flow Summary")
pdf.sub_sub_title("Farmer uploads a crop:")
pdf.body_text(
    "Farmer -> Frontend -> Farmer API -> MongoDB (save) + Redis Queue (enqueue) -> "
    "Background Worker picks up -> MSP Validation -> Feature Engineering (encode to vector) -> "
    "HNSW Index Service (insert into graph) -> Saved to .hnsw file"
)
pdf.sub_sub_title("Merchant searches for crops:")
pdf.body_text(
    "Merchant -> Frontend -> Merchant Search API -> Vector Service -> Query Encoding (encode to vector) -> "
    "HNSW ANN Search (find top 50) -> MongoDB (fetch details) -> Composite Rerank (filter + score) -> "
    "Top 5 results -> Frontend -> Merchant sees results"
)

#                                                                
# SECTION 3: TECH STACK
#                                                                
pdf.add_page()
pdf.section_title("3. TECH STACK (Every Technology & Why)")

pdf.sub_title("3.1 Frontend")

pdf.sub_sub_title("React.js")
pdf.bullet("JavaScript library for building user interfaces (by Facebook/Meta)")
pdf.bullet("Component-based - each page is a reusable component")
pdf.bullet("Virtual DOM - only updates what changed, making UI fast")
pdf.bullet("Single Page Application - page never fully reloads")

pdf.sub_sub_title("Vite")
pdf.bullet("Modern frontend build tool (replacement for Webpack)")
pdf.bullet("Instant dev server startup (< 1 second vs Webpack's 10-30 seconds)")
pdf.bullet("Hot Module Replacement - code changes appear instantly in browser")

pdf.check_page_break()
pdf.sub_title("3.2 Backend")

pdf.sub_sub_title("Python 3.13")
pdf.bullet("Best ecosystem for data science/ML - NumPy, hnswlib are Python-first")
pdf.bullet("Async support - native async/await for concurrent requests")

pdf.sub_sub_title("FastAPI")
pdf.bullet("Modern, high-performance Python web framework")
pdf.bullet("Fastest Python framework - built on Starlette + Uvicorn")
pdf.bullet("Async native - supports async/await out of the box")
pdf.bullet("Automatic Swagger API docs at /docs endpoint")
pdf.bullet("Pydantic validation - automatic request/response data validation")

pdf.sub_sub_title("Uvicorn")
pdf.bullet("ASGI server that runs the FastAPI app")
pdf.bullet("ASGI (not WSGI) - supports async I/O")
pdf.bullet("Built on uvloop - 2-4x faster than Python's default asyncio")

pdf.sub_sub_title("Pydantic")
pdf.bullet("Data validation library using Python type hints")
pdf.bullet("Automatic request validation - rejects invalid data with clear errors")
pdf.bullet("Defines schemas: FarmerUploadRequest, MerchantSearchRequest, LocationSchema, etc.")

pdf.check_page_break()
pdf.sub_title("3.3 Vector Search Engine")

pdf.sub_sub_title("hnswlib (C++ with Python bindings)")
pdf.bullet("C++ library implementing the HNSW algorithm - CORE of the project")
pdf.bullet("O(log N) search - finds nearest neighbours in logarithmic time")
pdf.bullet("Incremental inserts - add listings without rebuilding the index")
pdf.bullet("Written in C++ for raw speed, called from Python")
pdf.bullet("Why not FAISS: too complex, no easy incremental insert")
pdf.bullet("Why not Annoy: can't add items after building (static index)")

pdf.sub_sub_title("NumPy")
pdf.bullet("Python's core numerical computing library")
pdf.bullet("54-dimensional vectors are NumPy float32 arrays")
pdf.bullet("Required by hnswlib as input format")

pdf.check_page_break()
pdf.sub_title("3.4 Database")

pdf.sub_sub_title("MongoDB")
pdf.bullet("NoSQL document database - stores data as flexible JSON documents")
pdf.bullet("Flexible schema - different crops may have different attributes")
pdf.bullet("JSON-native - perfect for REST API")
pdf.bullet("Database: agrimatch, Collection: listings")

pdf.sub_sub_title("Motor (Async Driver) & PyMongo (Sync Driver)")
pdf.bullet("Motor: async MongoDB driver for FastAPI routes (non-blocking)")
pdf.bullet("PyMongo: sync driver for background worker thread")

pdf.check_page_break()
pdf.sub_title("3.5 Message Queue")

pdf.sub_sub_title("Redis")
pdf.bullet("In-memory data store used as a message queue")
pdf.bullet("LPUSH/BRPOP pattern - simple, reliable FIFO queue")
pdf.bullet("Sub-millisecond operations (LPUSH < 0.1ms)")
pdf.bullet("Why not RabbitMQ/Kafka: too heavy for single queue, single consumer use case")

pdf.check_page_break()
pdf.sub_title("3.6 Containerization")

pdf.sub_sub_title("Docker + Docker Compose")
pdf.bullet("Packages MongoDB and Redis into isolated containers")
pdf.bullet("One command (docker-compose up) starts everything")
pdf.bullet("Consistent environment across all machines")

pdf.check_page_break()
pdf.sub_title("3.7 Key Algorithms")

pdf.sub_sub_title("Haversine Formula")
pdf.bullet("Calculates great-circle distance between two GPS points on Earth")
pdf.bullet("Uses Earth radius (6,371 km) with trigonometric functions")
pdf.bullet("Used in reranking phase only - NOT inside HNSW")

pdf.sub_sub_title("One-Hot Encoding")
pdf.bullet("Converts crop name to binary vector: Tomato = [1,0,0,...,0]")
pdf.bullet("Ensures different crops are maximally distant in vector space")

pdf.sub_sub_title("Min-Max Normalization")
pdf.bullet("Scales values to [0,1]: normalized = (value - min) / (max - min)")
pdf.bullet("Prevents any single feature from dominating L2 distance")

# Tech stack summary table
pdf.check_page_break(60)
pdf.sub_title("3.8 Summary Table")
pdf.table_row3("Layer", "Technology", "Purpose", bold=True)
pdf.table_row3("UI Framework", "React.js", "Build interactive user interfaces")
pdf.table_row3("Build Tool", "Vite", "Fast dev server + production bundling")
pdf.table_row3("Backend", "FastAPI + Python", "REST API with async support")
pdf.table_row3("Server", "Uvicorn", "ASGI server to run FastAPI")
pdf.table_row3("Validation", "Pydantic", "Request/response data validation")
pdf.table_row3("Vector Search", "hnswlib (C++)", "O(log N) ANN search")
pdf.table_row3("Numerical", "NumPy", "Vector creation and math")
pdf.table_row3("Database", "MongoDB", "Store crop listings as documents")
pdf.table_row3("Async Driver", "Motor", "Non-blocking MongoDB access")
pdf.table_row3("Sync Driver", "PyMongo", "MongoDB access from worker")
pdf.table_row3("Queue", "Redis", "Async job queue (LPUSH/BRPOP)")
pdf.table_row3("Container", "Docker Compose", "Run MongoDB & Redis")

#                                                                
# SECTION 4: SLIDE-BY-SLIDE TALKING POINTS
#                                                                
pdf.add_page()
pdf.section_title("4. SLIDE-BY-SLIDE TALKING POINTS")

pdf.sub_sub_title("Slide 1 - Title Slide")
pdf.body_text(
    '"Good morning. Our project is PID-36: Farmer-Merchant Matching Platform Using Hierarchical '
    'Navigable Small World Graphs. Team: Endravath Krishna (733302) and Potharaju Srinivas (733305), '
    'under Dr. M Swamy Das."'
)

pdf.sub_sub_title("Slide 2 - Problem Statement")
pdf.bullet("Farmers lose 20-30% revenue to middlemen")
pdf.bullet("KNN = O(N) linear scan, too slow for large datasets")
pdf.bullet("K-Means = batch clustering, can't handle real-time insertions")
pdf.bullet("HNSW = O(log N) search + instant incremental inserts")
pdf.bullet("System enforces MSP compliance for fair pricing")

pdf.check_page_break()
pdf.sub_sub_title("Slide 3 - Design")
pdf.bullet("Vector encoding: 54-dimensional = [lat, lon, price, qty, 50 crop one-hot]")
pdf.bullet("All values normalized to [0,1] for equal weighting in L2 distance")
pdf.bullet("One HNSW index per crop - keeps indices small and search fast")

pdf.sub_sub_title("Slide 4 - Architecture")
pdf.bullet("3-tier: React Frontend -> FastAPI Backend -> MongoDB + Redis + HNSW")
pdf.bullet("Async insertion: Upload -> MongoDB -> Redis -> Worker -> HNSW (never blocks API)")
pdf.bullet("Two-phase search: Fast ANN (top-50) -> Exact Haversine reranking (top-5)")

pdf.check_page_break()
pdf.sub_sub_title("Slide 5 - Implementation")
pdf.bullet("HNSW parameters: M=16, ef_construction=200, ef_search=100, L2 space")
pdf.bullet("50 supported crops across 6 categories")
pdf.bullet("Composite reranking: 60% distance + 40% price")

pdf.sub_sub_title("Slides 6-10 - Demo Screenshots")
pdf.bullet("Signup -> Farmer Dashboard -> Crop Listings -> Merchant Dashboard -> Query Results")
pdf.bullet("Walk through the complete user flow from registration to search results")

#                                                                
# SECTION 5: Q&A PREPARATION
#                                                                
pdf.add_page()
pdf.section_title("5. LIKELY QUESTIONS & ANSWERS")

pdf.qa_block(
    "Q1: Why HNSW over KNN or K-Means?",
    "KNN does brute-force linear scan - O(N) per query. With 100K listings, that's slow. "
    "K-Means requires periodic re-clustering and can't handle real-time insertions. "
    "HNSW gives O(log N) search with instant incremental inserts - a new listing is indexed in "
    "milliseconds without rebuilding. Same algorithm used by Spotify, Airbnb, Elasticsearch."
)

pdf.qa_block(
    "Q2: What is the time complexity?",
    "Insert: O(log N) - navigates graph layers to find right neighbourhood. "
    "Search: O(log N) - starts from top layer, greedily descends. "
    "Compare: KNN is O(N), K-Means insert is O(K) but needs rebuild, HNSW is O(log N) for both."
)

pdf.qa_block(
    "Q3: What is MSP and why enforce it?",
    "MSP = Minimum Support Price, set by Indian Government. Examples: Rice Rs.22.03/kg, "
    "Wheat Rs.23.50/kg, Cotton Rs.67/kg. We reject any listing priced below MSP to prevent "
    "farmer exploitation. System has MSP data for 50+ crops."
)

pdf.check_page_break()
pdf.qa_block(
    "Q4: Explain the search pipeline step by step",
    "1. Merchant submits: crop, quantity, max_price, location, radius\n"
    "2. Query encoded into same 54-D vector space as listings\n"
    "3. HNSW returns top-50 approximate nearest neighbours (sub-millisecond)\n"
    "4. Fetch those 50 docs from MongoDB\n"
    "5. Filter out: inactive listings, MSP violators, over-budget prices\n"
    "6. Compute exact Haversine distance (great-circle, Earth R=6371 km)\n"
    "7. Filter by merchant's radius constraint\n"
    "8. Composite reranking: score = 0.6 x dist_norm + 0.4 x price_norm\n"
    "9. Return top-5 sorted by score (lower = better match)"
)

pdf.check_page_break()
pdf.qa_block(
    "Q5: Why separate HNSW index per crop?",
    "Prevents cross-crop interference in vector space. A tomato listing should never match a "
    "wheat query. Also keeps each index smaller = faster search. System lazy-creates indices on demand."
)

pdf.qa_block(
    "Q6: How do you handle concurrency / thread safety?",
    "Each crop index has its own threading.Lock. The background worker (inserts) and API handlers "
    "(queries) share the same singleton HNSWService. Reads and writes are serialized per-crop via "
    "locks. hnswlib is NOT thread-safe for concurrent writes, so this is mandatory."
)

pdf.check_page_break()
pdf.qa_block(
    "Q7: What happens on server restart?",
    "On shutdown: all HNSW indices serialized to disk (.hnsw binary + .meta.json mapping files). "
    "On startup: indices automatically loaded from disk. No data loss, no re-indexing from MongoDB needed."
)

pdf.qa_block(
    "Q8: What is the vector encoding? Why one-hot for crops?",
    "Vector = [lat_normalized, lon_normalized, price_normalized, qty_normalized, crop_one_hot_50]. "
    "One-hot ensures crops live in orthogonal dimensions - tomato and wheat have maximum L2 distance. "
    "Normalisation ensures no single feature dominates."
)

pdf.check_page_break()
pdf.qa_block(
    "Q9: Why Redis queue instead of direct insertion?",
    "Decouples API response from HNSW insertion. Farmer gets instant response (MongoDB write + "
    "Redis LPUSH < 5ms). Heavy HNSW insertion happens asynchronously in background thread. "
    "Keeps API latency low even under high load."
)

pdf.qa_block(
    "Q10: What is Haversine distance?",
    "Great-circle distance between two GPS points on Earth's surface. Uses Earth radius (6371 km) "
    "with trigonometric calculations. Used in reranking phase (not inside HNSW) because HNSW uses "
    "normalized coordinates where L2 distance is only an approximation of geographic distance."
)

pdf.check_page_break()
pdf.qa_block(
    "Q11: What are the HNSW parameters M and ef?",
    "M = 16: Each node connects to up to 16 neighbours per layer. Higher M = better recall but more "
    "memory. ef_construction = 200: Candidates evaluated during index building (quality vs build speed). "
    "ef_search = 100: Candidates during query time (recall vs latency)."
)

pdf.qa_block(
    "Q12: What database do you use and why?",
    "MongoDB - NoSQL document store. Flexible schema for varied crop listings. JSON-native, perfect "
    "for REST API. We use Motor (async driver) for API routes and PyMongo (sync driver) for the "
    "background worker thread."
)

pdf.check_page_break()
pdf.qa_block(
    "Q13: How is this different from existing platforms like eNAM?",
    "eNAM is government-run with limited tech. Our system uses vector similarity search for "
    "intelligent matching, not just keyword filters. Matches on multi-dimensional criteria "
    "(location, price, quantity) simultaneously. Also guarantees MSP compliance programmatically."
)

pdf.qa_block(
    "Q14: What are the supported crops?",
    "50 crops across 6 categories: Vegetables (15), Grains & Cereals (7), Fruits (10), "
    "Pulses & Oilseeds (8), Cash Crops (5), Spices (5). Examples: Tomato, Rice, Mango, "
    "Soybean, Cotton, Turmeric."
)

pdf.check_page_break()
pdf.qa_block(
    "Q15: Explain the composite reranking formula",
    "score = 0.6 x (distance / max_distance) + 0.4 x (price - min_price) / price_range. "
    "Both terms normalized to [0,1]. Score 0 = best (closest + cheapest). The 60/40 split "
    "prioritizes proximity over price - configurable via environment variables."
)

#                                                                
# SECTION 6: TOUGH QUESTIONS
#                                                                
pdf.add_page()
pdf.section_title("6. POTENTIAL TOUGH QUESTIONS")

pdf.sub_title("Limitations")
pdf.bullet("HNSW is approximate - may miss the true nearest neighbour (mitigated by large ef_search=100)")
pdf.bullet("No authentication/authorization yet (demo stage)")
pdf.bullet("Single-server architecture (not horizontally scalable yet)")
pdf.bullet("Lazy deletion - deactivated listings still occupy HNSW memory until restart")

pdf.sub_title("Future Work")
pdf.bullet("Add user authentication (JWT-based)")
pdf.bullet("Implement order management and payment integration")
pdf.bullet("Add real-time price alerts when MSP changes")
pdf.bullet("Deploy with Kubernetes for horizontal scaling")
pdf.bullet("Add multilingual support for rural farmers")

#                                                                
# SECTION 7: QUICK REFERENCE
#                                                                
pdf.add_page()
pdf.section_title("7. QUICK FACTS REFERENCE")

pdf.table_row("Fact", "Value", bold=True)
pdf.table_row("Vector dimension", "54 (4 numeric + 50 crop one-hot)")
pdf.table_row("Search complexity", "O(log N)")
pdf.table_row("KNN complexity", "O(N)")
pdf.table_row("HNSW candidates per query", "Top 50")
pdf.table_row("Final results returned", "Top 5")
pdf.table_row("Reranking weights", "60% distance, 40% price")
pdf.table_row("Supported crops", "50")
pdf.table_row("Default search radius", "500 km")
pdf.table_row("Backend framework", "FastAPI (Python)")
pdf.table_row("HNSW library", "hnswlib (C++)")
pdf.table_row("HNSW M parameter", "16")
pdf.table_row("HNSW ef_construction", "200")
pdf.table_row("HNSW ef_search", "100")
pdf.table_row("HNSW Space", "L2 (Euclidean)")
pdf.table_row("Initial index capacity", "10,000 (auto-doubles)")
pdf.table_row("Database", "MongoDB (agrimatch)")
pdf.table_row("Queue", "Redis (LPUSH/BRPOP)")
pdf.table_row("Normalization ranges", "Lat [-90,90], Lon [-180,180]")
pdf.table_row("Price range", "0 - 500 Rs/kg")
pdf.table_row("Quantity range", "0 - 50,000 kg")

#                                                                
# Save
#                                                                
output_path = r"c:\Users\srini\Downloads\Seminar_Preparation_PID36.pdf"
pdf.output(output_path)
print(f"PDF saved to: {output_path}")
