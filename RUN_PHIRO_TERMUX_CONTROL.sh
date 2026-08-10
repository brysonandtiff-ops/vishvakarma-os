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
pkg install -y git nodejs-lts jq curl

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

cd "$WORK"
printf '[PHIRO] Exact HEAD: %s\n' "$(git rev-parse HEAD)"
printf '[PHIRO] Installing dependencies...\n'
pnpm install --frozen-lockfile

mkdir -p .phiro/termux-evidence
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG=".phiro/termux-evidence/verify-$STAMP.log"

# Android-safe gates only. Browser/device/Windows-specific certification remains on a real runner host.
{
  echo "PHIRO_TERMUX_CONTROL=true"
  echo "HEAD=$(git rev-parse HEAD)"
  echo "NODE=$(node --version)"
  echo "PNPM=$(pnpm --version)"
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
