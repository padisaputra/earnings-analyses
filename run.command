#!/bin/bash

cd "/Users/patrickadisaputra/Desktop/Earnings Analyser"

PYTHON="/Users/patrickadisaputra/.pyenv/versions/3.12.2/bin/python"

# Start uvicorn in the background (with reload while developing)
"$PYTHON" -m uvicorn main:app --reload &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Open the browser automatically
open "http://127.0.0.1:8000/"

# Keep the terminal open as long as the server runs
wait $SERVER_PID

exec $SHELL
