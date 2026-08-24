#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

REPO="brysonandtiff-ops/vishvakarma-os"
BRANCH="feat/phiro-forge-self-hosted-runner"
REMOTE_SCRIPT_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/tools/phiro/Start-PHIROForgeRemote.ps1"

phone_ip() {
  python - <<'PY'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    print(s.getsockname()[0])
finally:
    s.close()
PY
}

looks_like_vpn() {
  local ip="$1"
  [[ "$ip" == 10.10.10.* ]]
}

ensure_vpn_off() {
  local ip
  ip="$(phone_ip 2>/dev/null || true)"

  if [[ -z "$ip" ]]; then
    echo "[PHIRO PRISM] Could not determine phone network address."
    return 0
  fi

  echo "[PHIRO PRISM] Phone route IP: $ip"

  if ! looks_like_vpn "$ip"; then
    echo "[PHIRO PRISM] No known VPN tunnel detected."
    return 0
  fi

  echo "[PHIRO PRISM] VPN/tunnel detected ($ip)."
  echo "[PHIRO PRISM] Android does not permit normal Termux apps to silently disable another VPN."
  echo "[PHIRO PRISM] Opening Android VPN settings now; disable the active VPN there."

  if command -v am >/dev/null 2>&1; then
    am start -a android.settings.VPN_SETTINGS >/dev/null 2>&1 || true
  else
    /system/bin/am start -a android.settings.VPN_SETTINGS >/dev/null 2>&1 || true
  fi

  echo "[PHIRO PRISM] Waiting for the VPN tunnel to disappear..."
  for _ in $(seq 1 120); do
    sleep 2
    ip="$(phone_ip 2>/dev/null || true)"
    if [[ -n "$ip" ]] && ! looks_like_vpn "$ip"; then
      echo "[PHIRO PRISM] VPN cleared. LAN IP: $ip"
      return 0
    fi
  done

  echo "[PHIRO PRISM] Timed out waiting for VPN shutdown."
  echo "[PHIRO PRISM] Turn the VPN off, return to Termux, and rerun ~/phiro-forge."
  exit 3
}

if ! command -v ssh >/dev/null 2>&1; then
  echo "[PHIRO PRISM] Installing OpenSSH client in Termux..."
  pkg install -y openssh
fi

ensure_vpn_off

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
