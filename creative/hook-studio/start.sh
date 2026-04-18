#!/bin/bash
# Hook Studio — Launch Script
# Starts the video generation server (zero dependencies, pure Node.js)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  🎬 Starting Hook Studio..."
echo "  ─────────────────────────"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  ❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
  echo "  ❌ FFmpeg not found. Install: brew install ffmpeg"
  exit 1
fi

echo "  ✅ Node.js $(node --version)"
echo "  ✅ FFmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
echo ""

# Start server
node "$SCRIPT_DIR/server.mjs"
