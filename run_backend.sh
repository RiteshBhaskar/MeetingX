#!/usr/bin/env bash
set -e

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Create .venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

# Ensure .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "Starting Backend on http://127.0.0.1:8000..."
exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
