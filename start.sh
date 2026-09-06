#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================="
echo " Starting Meeting Intelligence Platform (Phase 1)"
echo "=================================================="

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down backend and frontend..."
    kill $(jobs -p) 2>/dev/null || true
    wait $(jobs -p) 2>/dev/null || true
    echo "✅ All servers stopped."
}
trap cleanup EXIT INT TERM

# 1. Start Backend in background
echo "🚀 [1/2] Starting FastAPI Backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 2. Start Frontend
echo "✨ [2/2] Starting Vite React Frontend..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "--------------------------------------------------"
echo " ✅ Application is running!"
echo " 🌐 Frontend:  http://localhost:5173"
echo " 🔌 Backend:   http://127.0.0.1:8000"
echo " 📖 API Docs:  http://127.0.0.1:8000/docs"
echo "--------------------------------------------------"
echo " Press Ctrl+C to stop all servers."
echo ""

npm run dev
