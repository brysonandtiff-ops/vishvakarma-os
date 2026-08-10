#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

REPO="brysonandtiff-ops/vishvakarma-os"
BRANCH="feat/phiro-forge-self-hosted-runner"
REMOTE_SCRIPT_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/tools/phiro/Start-PHIROForgeRemote.ps1"

if ! command -v ssh >/dev/null 2>&1; then
  echo "[PHIRO PRISM] Installing OpenSSH client in Termux..."
  pkg install -y openssh
fi

WINDOWS_USER="${1:-}"
WINDOWS_HOST="${2:-}"

if [[ -z "$WINDOWS_USER" ]]; then
  read -r -p "Windows username: " WINDOWS_USER
fi

if [[ -z "$WINDOWS_HOST" ]]; then
  read -r -p "Windows PC IP/hostname: " WINDOWS_HOST
fi

if [[ -z "$WINDOWS_USER" || -z "$WINDOWS_HOST" ]]; then
  echo "[PHIRO PRISM] Windows username and host are required."
  exit 2
fi

printf '\n[PHIRO PRISM] Phone -> Windows control bridge\n'
printf '[PHIRO PRISM] Target: %s@%s\n' "$WINDOWS_USER" "$WINDOWS_HOST"
printf '[PHIRO PRISM] GitHub runner token will be requested INSIDE the encrypted SSH session.\n\n'

REMOTE_COMMAND=$(cat <<EOF
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "\$ErrorActionPreference='Stop'; \$u='${REMOTE_SCRIPT_URL}'; \$p=Join-Path \$env:TEMP 'Start-PHIROForgeRemote.ps1'; Invoke-WebRequest -UseBasicParsing -Uri \$u -OutFile \$p; & \$p"
EOF
)

ssh -tt "${WINDOWS_USER}@${WINDOWS_HOST}" "$REMOTE_COMMAND"
