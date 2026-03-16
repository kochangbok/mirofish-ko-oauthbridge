#!/usr/bin/env bash
set -euo pipefail

LABEL="com.george.mirofish-dev"
PROJECT_ROOT="/Users/george/.superset/projects/mirofishi-test"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$LABEL.plist"
mkdir -p "$LAUNCH_AGENTS_DIR" "$PROJECT_ROOT/.omx/logs"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$LABEL</string>

    <key>ProgramArguments</key>
    <array>
      <string>$PROJECT_ROOT/scripts/launchd-start.sh</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/.omx/logs/launchd.out.log</string>

    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/.omx/logs/launchd.err.log</string>

    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>

    <key>ProcessType</key>
    <string>Background</string>
  </dict>
</plist>

launchctl unload -w "$PLIST_PATH" 2>/dev/null || true
launchctl load -w "$PLIST_PATH"

echo "Installed $LABEL at $PLIST_PATH"
