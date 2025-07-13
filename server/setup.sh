#!/bin/bash

# Exit on error
set -e

echo "🔧 Setting up StackMotive Backend..."

# Create and activate virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python init_db.py

# Start the server
echo "🚀 Starting FastAPI server..."
echo "Server will be available at http://localhost:8000"
echo "API documentation at http://localhost:8000/docs"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 