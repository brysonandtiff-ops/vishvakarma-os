#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

REPO='https://github.com/brysonandtiff-ops/vishvakarma-os.git'
BRANCH='feat/phiro-forge-self-hosted-runner'
WORK="$HOME/phiro-vish"

fail(){ printf '\n[PHIRO CONTROL][FAIL] %s\n' "$*" >&2; exit 1; }

printf '\n=============================================\n'
printf ' PHIRO PRISM :: TERMUX CONTROL CLIENT\n'
printf '=============================================\n'
printf '[PHIRO] Android/Termux control mode — no GitHub runner runtime.\n'
printf '[PHIRO] Target branch: %s\n\n' "$BRANCH"

pkg update -y
pkg install -y git nodejs-lts jq curl python

if ! command -v corepack >/dev/null 2>&1; then
  npm install -g corepack
fi
corepack enable || true
corepack prepare pnpm@9.15.0 --activate

if [ ! -d "$WORK/.git" ]; then
  rm -rf "$WORK"
  git clone --filter=blob:none --single-branch --branch "$BRANCH" "$REPO" "$WORK"
else
  git -C "$WORK" fetch origin "$BRANCH"
  git -C "$WORK" checkout "$BRANCH"
  git -C "$WORK" reset --hard "origin/$BRANCH"
fi

[ -d "$WORK/.git" ] || fail "Repository checkout missing at $WORK"
[ -f "$WORK/package.json" ] || fail "package.json missing at $WORK/package.json"

cd "$WORK"
printf '[PHIRO] Working directory: %s\n' "$PWD"
printf '[PHIRO] Exact HEAD: %s\n' "$(git rev-parse HEAD)"
printf '[PHIRO] package.json: OK\n'
printf '[PHIRO] Installing dependencies in Android-safe mode...\n'

# Native postinstall tools such as @ast-grep/cli do not provide a reliable Android/Termux
# binary. We only need JS/TS dependencies for the Android-safe gates below, so lifecycle
# scripts are intentionally disabled here. This is a control/verification environment,
# not a production build host.
rm -rf node_modules
pnpm install --frozen-lockfile --ignore-scripts

mkdir -p .phiro/termux-evidence
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG=".phiro/termux-evidence/verify-$STAMP.log"

# Android-safe gates only. Browser/device/Windows/native-binary certification remains on a real runner host.
{
  echo "PHIRO_TERMUX_CONTROL=true"
  echo "HEAD=$(git rev-parse HEAD)"
  echo "NODE=$(node --version)"
  echo "PNPM=$(pnpm --version)"
  echo "INSTALL_MODE=pnpm --ignore-scripts"
  echo "--- lint types ---"
  pnpm run lint:types
  echo "--- contract gates ---"
  pnpm run contract:gates
  echo "--- auth gates ---"
  pnpm run auth:gates
  echo "--- hardening gates ---"
  pnpm run hardening:gates
  echo "--- docs verify ---"
  pnpm run docs:verify
  echo "PHIRO_TERMUX_VERIFY_OK=true"
} 2>&1 | tee "$LOG"

printf '\nPHIRO_TERMUX_VERIFY_OK=true\n'
printf 'PHIRO_TERMUX_EVIDENCE=%s/%s\n' "$WORK" "$LOG"
printf '[PHIRO] This proves Android-safe repository gates only; it is not a substitute for Windows/browser/live production certification.\n'
