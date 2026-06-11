#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"

cd "$ROOT_DIR"

command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
command -v npm >/dev/null || { echo "npm is required."; exit 1; }
command -v "$PYTHON_BIN" >/dev/null || { echo "Python 3 is required."; exit 1; }

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from backend/.env.example"
fi

echo "Installing backend dependencies..."
npm ci --prefix backend

echo "Installing frontend dependencies..."
npm ci --prefix app

if [ ! -d ai-service/.venv ]; then
  "$PYTHON_BIN" -m venv ai-service/.venv
fi

echo "Installing AI service dependencies..."
ai-service/.venv/bin/python -m pip install -r ai-service/requirements.txt

echo
echo "Development dependencies are ready."
echo "Run: bash scripts/start-dev.sh"
