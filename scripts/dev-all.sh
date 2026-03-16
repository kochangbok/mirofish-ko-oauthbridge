#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

is_healthy() {
  local url="$1"
  python3 - "$url" <<'PY'
import sys, urllib.request
url = sys.argv[1]
try:
    with urllib.request.urlopen(url, timeout=1.5) as r:
        sys.exit(0 if 200 <= r.status < 500 else 1)
except Exception:
    sys.exit(1)
PY
}

all_services_healthy() {
  is_healthy "http://127.0.0.1:3000" \
    && is_healthy "http://127.0.0.1:5001/health" \
    && is_healthy "http://127.0.0.1:8787/health"
}

show_current_listeners() {
  echo "[dev:all] Current listeners:"
  for port in 3000 5001 8787; do
    lsof -nP -iTCP:${port} -sTCP:LISTEN || echo "[dev:all] Port ${port}: clear"
  done
}

if all_services_healthy && [[ "${FORCE_RESTART:-0}" != "1" ]]; then
  echo "[dev:all] Frontend, backend, and bridge are already running."
  echo "[dev:all] Reusing existing services instead of starting duplicates."
  echo "[dev:all] Frontend: http://localhost:3000"
  echo "[dev:all] Backend : http://localhost:5001"
  echo "[dev:all] Bridge  : http://127.0.0.1:8787/health"
  echo "[dev:all] If you want a clean restart, run:"
  echo "           npm run stop:all"
  echo "           FORCE_RESTART=1 npm run dev:all"
  exit 0
fi

if [[ "${FORCE_RESTART:-0}" == "1" ]]; then
  echo "[dev:all] FORCE_RESTART=1 detected. Stopping existing listeners first."
  bash "$ROOT_DIR/scripts/stop-all.sh"
fi

cleanup() {
  if [[ -n "${DEV_ALL_PID:-}" ]]; then
    kill "$DEV_ALL_PID" 2>/dev/null || true
    wait "$DEV_ALL_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

npx concurrently --kill-others \
  -n "bridge,backend,frontend" \
  -c "magenta,green,cyan" \
  "npm run bridge" \
  "npm run backend" \
  "npm run frontend" &
DEV_ALL_PID=$!

node "$ROOT_DIR/scripts/health-check.mjs" --wait

echo
echo "[health] All services look reachable."
echo "[health] Frontend: http://localhost:3000"
echo "[health] Backend : http://localhost:5001"
echo "[health] Bridge  : http://127.0.0.1:8787/health"
echo

wait "$DEV_ALL_PID"
