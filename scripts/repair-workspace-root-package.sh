#!/usr/bin/env bash
set -euo pipefail

# Safe wrapper for repairing the parent Vishvakarma.OS workspace package.json.
# Works from Git Bash, Linux, macOS, or WSL. It delegates to the Python script
# and forwards any flags, e.g. --dry-run or --target ../package.json.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_SCRIPT="$SCRIPT_DIR/repair-workspace-root-package.py"

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$PY_SCRIPT" "$@"
elif command -v python >/dev/null 2>&1; then
  exec python "$PY_SCRIPT" "$@"
elif command -v py >/dev/null 2>&1; then
  exec py -3 "$PY_SCRIPT" "$@"
else
  echo "[repair] Python 3 is required. Install Python, then rerun this script." >&2
  exit 1
fi
