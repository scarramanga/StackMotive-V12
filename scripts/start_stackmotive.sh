#!/bin/bash

echo "🔁 Cleaning up old backend processes..."
pkill -f 'uvicorn' || true
pkill -f 'python' || true
sleep 1

echo "✅ Activating virtual environment..."
source venv/bin/activate || { echo "❌ Failed to activate venv. Check path."; exit 1; }

echo "🚀 Starting FastAPI backend on port 8000..."
nohup uvicorn server.main:app --reload --port 8000 >> backend.log 2>&1 &

echo "🌐 Starting Vite frontend on port 5173..."
cd client || exit 1
nohup npm run dev >> ../frontend.log 2>&1 &
cd ..

echo "✅ Both frontend and backend are running."
echo "📒 Backend logs: tail -f backend.log"
echo "💡 To stop both: pkill -f 'uvicorn' && pkill -f 'npm'"

