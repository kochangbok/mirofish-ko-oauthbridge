#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/Users/george/.superset/projects/mirofishi-test"
SESSION_NAME="mirofish-dev"

export HOME="/Users/george"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

mkdir -p "$PROJECT_ROOT/.omx/logs"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  exit 0
fi

cd "$PROJECT_ROOT"
tmux new-session -d -s "$SESSION_NAME" "cd '$PROJECT_ROOT' && npm run dev:all"
