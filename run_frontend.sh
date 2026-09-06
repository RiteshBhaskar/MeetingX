#!/usr/bin/env bash
set -e

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Install node_modules if missing
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Frontend on http://localhost:5173..."
exec npm run dev
