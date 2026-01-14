#!/bin/bash

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "========================================"
echo "   Starting Earnings Analyser App"
echo "========================================"

# 1. Build Frontend
echo "[1/3] Checking Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "      Installing dependencies (first run only)..."
    npm install
fi

echo "      Building React App..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "      Error building frontend. Check logs."
    exit 1
fi
echo "      Frontend built successfully."
cd ..

# 2. Launch
echo "[2/3] Launching Server..."
echo "      App will be available at http://127.0.0.1:8000"

# Open browser in background after 2 seconds
(sleep 2 && open "http://127.0.0.1:8000") &

# 3. Start Uvicorn
echo "[3/3] Press Ctrl+C to stop."
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000

