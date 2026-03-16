#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT="${PORT:-8787}"
export BRIDGE_PROVIDER="${BRIDGE_PROVIDER:-codex}"
export CODEX_MODEL="${CODEX_MODEL:-gpt-5.1-codex-mini}"
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
export CODEX_BRIDGE_WORKDIR="${CODEX_BRIDGE_WORKDIR:-$(pwd)}"

echo "PORT=$PORT"
echo "BRIDGE_PROVIDER=$BRIDGE_PROVIDER"
echo "CODEX_MODEL=$CODEX_MODEL"
echo "GEMINI_MODEL=$GEMINI_MODEL"
echo "CODEX_BRIDGE_WORKDIR=$CODEX_BRIDGE_WORKDIR"

npm run dev:all
