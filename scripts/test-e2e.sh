#!/bin/bash

# StackMotive E2E Test Runner
# Ensures reliable Cypress testing with proper server startup sequencing

set -e  # Exit on any error

echo "🚀 StackMotive E2E Test Runner Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a URL is responding
check_url() {
  local url=$1
  local name=$2
  local max_attempts=30
  local attempt=1
  
  echo -e "${BLUE}🔍 Checking ${name} at ${url}...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s --connect-timeout 2 "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ ${name} is responding (attempt $attempt)${NC}"
      return 0
    fi
    
    echo -e "${YELLOW}⏳ Waiting for ${name}... (attempt $attempt/$max_attempts)${NC}"
    sleep 2
    ((attempt++))
  done
  
  echo -e "${RED}❌ ${name} failed to respond after $max_attempts attempts${NC}"
  return 1
}

# Function to cleanup processes on exit
cleanup() {
  echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
  if [ ! -z "$VITE_PID" ]; then
    kill $VITE_PID 2>/dev/null || true
  fi
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Parse arguments
OPEN_MODE=false
FULL_MODE=false
SPEC_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --open)
      OPEN_MODE=true
      shift
      ;;
    --full)
      FULL_MODE=true
      shift
      ;;
    --spec)
      SPEC_FILE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--open] [--full] [--spec path/to/spec.cy.ts]"
      echo "  --open: Open Cypress GUI instead of running headless"
      echo "  --full: Start both backend and frontend (default: frontend only)"
      echo "  --spec: Run specific test spec file"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Mode: $([ "$OPEN_MODE" = true ] && echo "Interactive (GUI)" || echo "Headless")"
echo -e "  Servers: $([ "$FULL_MODE" = true ] && echo "Frontend + Backend" || echo "Frontend only")"
echo -e "  Spec: ${SPEC_FILE:-"All tests"}"
echo ""

# Check if servers are already running
FRONTEND_RUNNING=false
BACKEND_RUNNING=false

if curl -s --connect-timeout 2 http://localhost:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Frontend already running on localhost:5173${NC}"
  FRONTEND_RUNNING=true
fi

if curl -s --connect-timeout 2 http://localhost:8000/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend already running on localhost:8000${NC}"
  BACKEND_RUNNING=true
fi

# Start servers if needed
if [ "$FULL_MODE" = true ] && [ "$BACKEND_RUNNING" = false ]; then
  echo -e "${BLUE}🔧 Starting backend server...${NC}"
  cd server && ../venv/bin/uvicorn main:app --reload --port 8000 &
  BACKEND_PID=$!
  cd ..
  
  # Wait for backend to be ready
  check_url "http://localhost:8000/api/health" "Backend"
fi

if [ "$FRONTEND_RUNNING" = false ]; then
  echo -e "${BLUE}🔧 Starting frontend server...${NC}"
  npm run dev:client &
  VITE_PID=$!
  
  # Wait for frontend to be ready
  check_url "http://localhost:5173" "Frontend"
fi

# Double-check both servers if full mode
if [ "$FULL_MODE" = true ]; then
  check_url "http://localhost:8000/api/health" "Backend"
fi
check_url "http://localhost:5173" "Frontend"

echo -e "${GREEN}🎯 All servers ready! Starting Cypress...${NC}"
echo ""

# Build Cypress command
CYPRESS_CMD="cypress"
if [ "$OPEN_MODE" = true ]; then
  CYPRESS_CMD="$CYPRESS_CMD open"
else
  CYPRESS_CMD="$CYPRESS_CMD run"
fi

if [ ! -z "$SPEC_FILE" ]; then
  CYPRESS_CMD="$CYPRESS_CMD --spec $SPEC_FILE"
fi

# Run Cypress
echo -e "${BLUE}🧪 Running: npx $CYPRESS_CMD${NC}"
npx $CYPRESS_CMD

# Success message
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
else
  echo -e "\n${RED}❌ Tests failed or were interrupted${NC}"
  exit 1
fi 