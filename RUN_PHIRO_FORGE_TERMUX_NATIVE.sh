#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

REPO_URL='https://github.com/brysonandtiff-ops/vishvakarma-os'
RUNNER_VERSION='2.336.0'
RUNNER_SHA256='58b758e420b87093fbd4bfddd368074960053e2f1388f01848c82624b90f27d1'
RUNNER_NAME='PHIRO-TERMUX-ARM64'
RUNNER_LABELS='phiro-termux,linux,arm64'
UBUNTU_USER='phiro'

fail() {
  printf '\n[PHIRO PRISM][FAIL] %s\n' "$*" >&2
  exit 1
}

printf '\n=============================================\n'
printf ' PHIRO PRISM :: TERMUX ARM64 FORGE RUNNER\n'
printf '=============================================\n'
printf '[PHIRO PRISM] Repository: %s\n' "$REPO_URL"
printf '[PHIRO PRISM] Runner:     v%s / Linux ARM64\n\n' "$RUNNER_VERSION"

ARCH="$(uname -m)"
case "$ARCH" in
  aarch64|arm64) ;;
  *) fail "This launcher requires an ARM64 Android device. Detected: $ARCH" ;;
esac

pkg update -y
pkg install -y proot-distro curl coreutils openssl

# Best-effort Android wakelock; absence must never block CI bootstrap.
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock || true
fi

if ! proot-distro login ubuntu -- true >/dev/null 2>&1; then
  printf '[PHIRO PRISM] Installing Ubuntu/proot...\n'
  proot-distro install ubuntu
fi

# Root phase: install OS dependencies, create a dedicated non-root runner user,
# download the pinned ARM64 runner, verify its official GitHub SHA-256, and repair
# interrupted/partial extraction state deterministically.
proot-distro login ubuntu --shared-tmp -- bash -lc "
set -Eeuo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl ca-certificates tar git jq libicu-dev libssl-dev util-linux

if ! id -u '${UBUNTU_USER}' >/dev/null 2>&1; then
  useradd -m -s /bin/bash '${UBUNTU_USER}'
fi

RUNNER_ROOT='/home/${UBUNTU_USER}/actions-runner'
mkdir -p \"\$RUNNER_ROOT\"
chown -R '${UBUNTU_USER}:${UBUNTU_USER}' '/home/${UBUNTU_USER}'

PKG=actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz
URL=https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/\$PKG
cd \"\$RUNNER_ROOT\"

need_download=0
if [ ! -f \"\$PKG\" ]; then
  need_download=1
else
  actual=\$(sha256sum \"\$PKG\" | awk '{print \$1}')
  if [ \"\$actual\" != '${RUNNER_SHA256}' ]; then
    echo '[PHIRO PRISM] Existing runner archive checksum is wrong; removing it.'
    rm -f \"\$PKG\"
    need_download=1
  fi
fi

if [ \"\$need_download\" -eq 1 ]; then
  echo '[PHIRO PRISM] Downloading pinned GitHub Actions Runner ARM64 archive...'
  curl --fail --location --retry 5 --retry-delay 2 --continue-at - \"\$URL\" -o \"\$PKG\"
fi

actual=\$(sha256sum \"\$PKG\" | awk '{print \$1}')
if [ \"\$actual\" != '${RUNNER_SHA256}' ]; then
  echo \"[PHIRO PRISM] SHA-256 mismatch: \$actual\" >&2
  exit 40
fi
echo '[PHIRO PRISM] ARM64 runner checksum verified.'

# If extraction was interrupted, remove only extracted runtime files while
# preserving a valid registration (.runner/.credentials) when present.
if [ ! -x ./config.sh ] || [ ! -x ./run.sh ]; then
  echo '[PHIRO PRISM] Extracting runner package...'
  tar xzf \"\$PKG\"
fi

chown -R '${UBUNTU_USER}:${UBUNTU_USER}' \"\$RUNNER_ROOT\"
"

# Registration phase runs as an ordinary Linux user, avoiding the GitHub
# runner's root/sudo guard entirely.
if ! proot-distro login ubuntu --user "$UBUNTU_USER" -- bash -lc 'test -f "$HOME/actions-runner/.runner"'; then
  printf '\nPaste fresh GitHub runner registration token: '
  IFS= read -r -s RUNNER_TOKEN
  printf '\n'
  [ -n "$RUNNER_TOKEN" ] || fail 'Registration token cannot be empty.'

  # Pass the short-lived token through stdin to the non-root shell; do not
  # persist it in the repository or a config file.
  printf '%s\n' "$RUNNER_TOKEN" | proot-distro login ubuntu --user "$UBUNTU_USER" -- bash -lc "
set -Eeuo pipefail
cd \"\$HOME/actions-runner\"
IFS= read -r RUNNER_TOKEN
./config.sh --unattended \\
  --url '${REPO_URL}' \\
  --token \"\$RUNNER_TOKEN\" \\
  --name '${RUNNER_NAME}' \\
  --labels '${RUNNER_LABELS}' \\
  --work '_work' \\
  --replace \\
  --disableupdate
unset RUNNER_TOKEN
"
  unset RUNNER_TOKEN
fi

printf '\n[PHIRO PRISM] Registration present. Starting runner...\n'
printf '[PHIRO PRISM] Keep Termux open while jobs execute.\n'
printf 'PHIRO_TERMUX_RUNNER_CONFIGURED=true\n\n'

# exec preserves Ctrl+C behavior and gives the runner the terminal directly.
exec proot-distro login ubuntu --user "$UBUNTU_USER" -- bash -lc '
set -Eeuo pipefail
cd "$HOME/actions-runner"
exec ./run.sh
'
