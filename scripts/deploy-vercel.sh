#!/bin/bash

# Production deploy: runs release gates, requires a clean git tree, then deploys.
# Does not stage, commit, or push — commit your changes explicitly before running.
# Requires bash (Git Bash or WSL on Windows).

set -e

echo "🔍 Running pre-deployment verification..."
pnpm run verify:ci

echo "🔒 Checking for a clean git working tree..."
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "❌ Deployment aborted: uncommitted changes detected."
  echo "   Commit or stash your changes before deploying. This script does not modify git state."
  exit 1
fi

echo "🚀 Deploying to Vercel (Production)..."
npx vercel --prod

echo "🔎 Running post-deploy smoke..."
pnpm run stability:post-deploy

echo "✅ Deployment complete!"
