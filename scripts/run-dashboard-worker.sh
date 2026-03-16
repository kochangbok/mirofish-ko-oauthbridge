#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/dashboard"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    GITHUB_TOKEN="$(gh auth token)"
    export GITHUB_TOKEN
  fi
fi

export GITHUB_OWNER="${GITHUB_OWNER:-kochangbok}"
export GITHUB_REPO="${GITHUB_REPO:-mirofish-ko-oauthbridge}"
export DASHBOARD_BRANCH="${DASHBOARD_BRANCH:-dashboard-data}"
export MIROFISH_BACKEND_BASE_URL="${MIROFISH_BACKEND_BASE_URL:-http://127.0.0.1:5001}"
export DASHBOARD_MAX_ROUNDS="${DASHBOARD_MAX_ROUNDS:-16}"
export DASHBOARD_SIMULATION_PLATFORM="${DASHBOARD_SIMULATION_PLATFORM:-parallel}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "[worker] Missing GITHUB_TOKEN and could not derive one from gh auth." >&2
  exit 1
fi

printf '[worker] owner=%s repo=%s branch=%s backend=%s rounds=%s platform=%s\n' \
  "$GITHUB_OWNER" "$GITHUB_REPO" "$DASHBOARD_BRANCH" "$MIROFISH_BACKEND_BASE_URL" "$DASHBOARD_MAX_ROUNDS" "$DASHBOARD_SIMULATION_PLATFORM"

npm run worker -- "$@"
