#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTS=(3000 5001 8787)

echo "[stop] Looking for listeners on: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  pids="$(lsof -tiTCP:${port} -sTCP:LISTEN || true)"
  if [[ -z "$pids" ]]; then
    echo "[stop] Port ${port}: no listener"
    continue
  fi

  echo "[stop] Port ${port}: stopping PID(s) $(echo "$pids" | tr '\n' ' ')"
  kill $pids 2>/dev/null || true
done

echo "[stop] Looking for orphaned simulation / bridge child processes in $ROOT_DIR"
python3 - "$ROOT_DIR" <<'PY'
import os, signal, subprocess, sys
root = sys.argv[1]
markers = (
    "run_parallel_simulation.py",
    "run_reddit_simulation.py",
    "run_twitter_simulation.py",
)
targets = []
ps = subprocess.check_output(["ps", "-axo", "pid=,command="], text=True)
for line in ps.splitlines():
    line = line.strip()
    if not line:
        continue
    pid_str, command = line.split(None, 1)
    pid = int(pid_str)
    if pid == os.getpid():
        continue
    in_repo = root in command
    is_sim_runner = any(marker in command for marker in markers)
    is_bridge_codex = "codex exec" in command and f"-C {root}" in command
    if in_repo and (is_sim_runner or is_bridge_codex):
        targets.append((pid, command))

for pid, command in targets:
    print(f"[stop] Killing orphan PID {pid}: {command[:180]}")
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
PY

sleep 2

sleep 1

echo "[stop] Remaining listeners:"
for port in "${PORTS[@]}"; do
  lsof -nP -iTCP:${port} -sTCP:LISTEN || echo "[stop] Port ${port}: clear"
done
