#!/usr/bin/env bash
set -euo pipefail

LABEL="com.george.mirofish-dev"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
launchctl unload -w "$PLIST_PATH" 2>/dev/null || true
rm -f "$PLIST_PATH"

echo "Removed $LABEL"
