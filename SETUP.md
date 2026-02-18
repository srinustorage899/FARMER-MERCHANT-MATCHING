# ─── AgriMatch — Quick Setup Guide ──────────────────────────────────────
#
# Prerequisites:
#   • Python 3.10+       (python --version)
#   • MongoDB running     (mongod or MongoDB Atlas)
#   • Docker Desktop      (for Redis)
#
# ── 1. Start Redis via Docker ───────────────────────────────────────────
#    From the project root (d:\HOPE):
#
#      docker compose up -d
#
# ── 2. Create virtual environment & install deps ────────────────────────
#
#      cd backend
#      python -m venv venv
#      .\venv\Scripts\Activate.ps1
#      pip install -r requirements.txt
#
# ── 3. Run the server ──────────────────────────────────────────────────
#
#      uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
#
# ── 4. Open the app ────────────────────────────────────────────────────
#
#      http://localhost:8000/            → Frontend (served as static files)
#      http://localhost:8000/docs        → Swagger UI (interactive API docs)
#      http://localhost:8000/health      → Health check
#
# ── API Endpoints ──────────────────────────────────────────────────────
#
#   POST /api/farmer/upload     → Create a crop listing
#   POST /api/merchant/search   → Search for nearby farmers
#
