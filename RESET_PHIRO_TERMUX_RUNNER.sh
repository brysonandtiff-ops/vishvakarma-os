#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

printf '\n[PHIRO PRISM] Resetting Termux runner registration metadata only...\n'

if ! command -v proot-distro >/dev/null 2>&1; then
  echo '[PHIRO PRISM] proot-distro is not installed; nothing to reset.'
  exit 0
fi

proot-distro login ubuntu -- bash -lc '
set -Eeuo pipefail
ROOT=/home/phiro/actions-runner
if [ ! -d "$ROOT" ]; then
  echo "[PHIRO PRISM] Runner directory does not exist; nothing to reset."
  exit 0
fi
rm -f "$ROOT/.runner" "$ROOT/.credentials" "$ROOT/.credentials_rsaparams" "$ROOT/.service"
rm -rf "$ROOT/_diag"
chown -R phiro:phiro /home/phiro
printf "PHIRO_TERMUX_RUNNER_RESET=true\n"
'

printf '[PHIRO PRISM] Run ~/phiro-termux again and provide a fresh registration token.\n'
