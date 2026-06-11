#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"

cd "$ROOT_DIR"

command -v docker >/dev/null || {
  echo "Docker is required to start the development MongoDB service."
  echo "In GitHub Codespaces, rebuild the container if Docker is unavailable."
  exit 1
}

dependencies_ready() {
  [ -f backend/.env ] &&
  [ -x ai-service/.venv/bin/python ] &&
  (cd backend && node -e "require.resolve('express')") >/dev/null 2>&1 &&
  (cd app && node -e "require.resolve('@babel/core'); require.resolve('vite')") >/dev/null 2>&1
}

if ! dependencies_ready; then
  echo "Development dependencies are missing or incomplete; reinstalling..."
  bash scripts/setup-dev.sh
fi

echo "Starting MongoDB..."
docker compose -f "$COMPOSE_FILE" up -d mongo

echo "Waiting for MongoDB..."
until docker compose -f "$COMPOSE_FILE" exec -T mongo mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
  sleep 2
done

if grep -Eq '^DEV_ADMIN_EMAIL=.+$' backend/.env &&
   grep -Eq '^DEV_STUDENT_EMAIL=.+$' backend/.env &&
   grep -Eq '^DEV_ACCOUNT_PASSWORD=.+$' backend/.env; then
  echo "Creating or updating configured development accounts..."
  npm --prefix backend run seed:accounts
else
  echo "Development accounts are not configured; signup remains available."
  echo "Set DEV_ADMIN_EMAIL, DEV_STUDENT_EMAIL, and DEV_ACCOUNT_PASSWORD in backend/.env to seed approved accounts."
fi

cleanup() {
  trap - EXIT INT TERM
  kill "${BACKEND_PID:-}" "${AI_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend, AI service, and frontend..."
(cd backend && npm run dev) &
BACKEND_PID=$!
(cd ai-service && .venv/bin/python main.py) &
AI_PID=$!
(cd app && npm run dev -- --host 0.0.0.0) &
FRONTEND_PID=$!

echo
echo "LearnSync development services are running:"
echo "  Frontend:   http://localhost:5173"
echo "  Backend:    http://localhost:5000/health"
echo "  AI service: http://localhost:8000/health"
echo "Press Ctrl+C to stop the application services."

wait -n "$BACKEND_PID" "$AI_PID" "$FRONTEND_PID"
