#!/bin/bash

# --- StackMotive Unified Dev Server Restart Script ---
# Must be run from project root

set -e

# Check for project root
if [[ ! -f server/main.py ]]; then
  echo "❌ ERROR: Must run from project root (where server/main.py exists)"
  exit 1
fi

# Kill old processes
pkill -f 'uvicorn' || true
pkill -f 'npm run dev' || true
pkill -f 'python' || true
sleep 1

# Start backend
cd server
nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../server.log 2>&1 &
cd ..
sleep 2

# Backend health checks
if curl -s --max-time 2 http://localhost:8000/api/docs | grep -q openapi; then
  echo "✅ BACKEND: /api/docs OK"
else
  echo "❌ BACKEND: /api/docs unreachable"
  exit 2
fi

if curl -s --max-time 2 -X OPTIONS http://localhost:8000/api/login | grep -q '200'; then
  echo "✅ BACKEND: /api/login preflight OK"
else
  echo "❌ BACKEND: /api/login preflight failed"
  exit 3
fi

# Start frontend
cd client
nohup npm run dev -- --port 5173 > ../client.log 2>&1 &
cd ..
sleep 2

# Frontend health check
if curl -s --max-time 2 http://localhost:5173 | grep -q StackMotive; then
  echo "✅ FRONTEND: Homepage served"
else
  echo "❌ FRONTEND: Homepage check failed"
  exit 4
fi

echo "\nAll servers running and healthy!" 