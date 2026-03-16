#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/Users/george/.superset/projects/mirofishi-test"
SESSION_NAME="mirofish-dev"

export HOME="/Users/george"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

cd "$PROJECT_ROOT"
npm run stop:all || true
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
