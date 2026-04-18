#!/bin/bash
# Start the SMMFactory Review Engine
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ⭐  SMMFactory — Review Engine"
echo "  ──────────────────────────────"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "  ❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Create data directory
mkdir -p data

# Check if already running on port 3848
if lsof -ti:3848 &>/dev/null; then
  echo "  ⚠️  Already running on port 3848"
  echo "  → http://localhost:3848"
  open "http://localhost:3848" 2>/dev/null || echo "  Open: http://localhost:3848"
  exit 0
fi

echo "  Starting server..."
node server.mjs &
SERVER_PID=$!

# Wait for server to be ready
sleep 1
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "  ✅ Review Engine running — PID $SERVER_PID"
  echo "  → http://localhost:3848"
  open "http://localhost:3848" 2>/dev/null || true
else
  echo "  ❌ Server failed to start"
  exit 1
fi
