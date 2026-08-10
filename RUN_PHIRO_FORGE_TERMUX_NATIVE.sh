#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

REPO_URL='https://github.com/brysonandtiff-ops/vishvakarma-os'
RUNNER_VERSION='2.336.0'
RUNNER_NAME='PHIRO-TERMUX-ARM64'
RUNNER_LABELS='phiro-termux,linux,arm64'

printf '\n=============================================\n'
printf ' PHIRO PRISM :: TERMUX NATIVE ARM64 RUNNER\n'
printf '=============================================\n'
printf '[PHIRO PRISM] This runner lives on the phone via Ubuntu/proot.\n'
printf '[PHIRO PRISM] Use only for trusted branches/workflows.\n\n'

pkg install -y proot-distro curl tar coreutils openssl

if ! proot-distro login ubuntu -- true >/dev/null 2>&1; then
  echo '[PHIRO PRISM] Installing Ubuntu...'
  proot-distro install ubuntu
fi

proot-distro login ubuntu --shared-tmp -- bash -lc "
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export RUNNER_ALLOW_RUNASROOT=1
apt-get update
apt-get install -y curl ca-certificates tar git jq libicu-dev libssl-dev
mkdir -p /root/actions-runner
cd /root/actions-runner
PKG=actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz
URL=https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/\$PKG
if [ ! -f \$PKG ]; then curl -fL \$URL -o \$PKG; fi
if [ ! -f ./config.sh ]; then tar xzf \$PKG; fi
if [ ! -f .runner ]; then
  read -r -s -p 'Paste fresh GitHub runner registration token: ' RUNNER_TOKEN
  printf '\\n'
  if [ -z \"\$RUNNER_TOKEN\" ]; then
    echo '[PHIRO PRISM] Registration token cannot be empty.'
    exit 2
  fi
  RUNNER_ALLOW_RUNASROOT=1 ./config.sh --unattended --url '${REPO_URL}' --token \"\$RUNNER_TOKEN\" --name '${RUNNER_NAME}' --labels '${RUNNER_LABELS}' --work '_work' --replace
  unset RUNNER_TOKEN
fi
printf 'PHIRO_TERMUX_RUNNER_CONFIGURED=true\\n'
printf 'Starting runner. Keep Termux alive while jobs execute.\\n'
exec env RUNNER_ALLOW_RUNASROOT=1 ./run.sh
"
