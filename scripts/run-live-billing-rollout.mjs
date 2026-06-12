#!/usr/bin/env node
/**
 * Polls for sk_live_ in .env.stripe.local or clipboard, then runs full live billing rollout.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const LIVE_ROOT = process.cwd();
const WORKSPACE_ROOT = join(LIVE_ROOT, '..');
const ENV_PATH = join(LIVE_ROOT, '.env.stripe.local');
const MAX_ATTEMPTS = 120;

function readSecretKey() {
  if (!existsSync(ENV_PATH)) return '';
  const match = readFileSync(ENV_PATH, 'utf8').match(/^STRIPE_SECRET_KEY=(\S+)/m);
  return match?.[1] ?? '';
}

function tryClipboardImport() {
  spawnSync('pnpm', ['run', 'import:stripe-live-key', '--', '--clipboard'], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe',
  });
}

function promptForLiveKey() {
  console.log('[INFO] Opening paste dialog for sk_live_...');
  spawnSync('pnpm', ['run', 'import:stripe-live-key'], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    shell: true,
    stdio: 'inherit',
  });
}

function runStep(label, command, args, cwd) {
  console.log(`[INFO] ${label}...`);
  const result = spawnSync(command, args, { cwd, shell: true, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`[FAIL] ${label}`);
    process.exit(result.status ?? 1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!readSecretKey().startsWith('sk_live_')) {
    promptForLiveKey();
  }

  if (readSecretKey().startsWith('sk_live_')) {
    console.log('[OK] sk_live_ ready in .env.stripe.local');
    runStep('Live Stripe setup', 'pnpm', ['run', 'setup:stripe-live:cli'], WORKSPACE_ROOT);
    runStep('Production redeploy', 'vercel', ['--prod', '--yes'], LIVE_ROOT);
    runStep('Strict billing verify', 'pnpm', ['run', 'verify:stripe-billing', '--', '--strict'], LIVE_ROOT);
    console.log('[OK] Live billing rollout complete');
    return;
  }

  console.log('[INFO] Waiting for sk_live_ — paste dialog opens on: pnpm run import:stripe-live-key');
  console.log('[INFO] Polling clipboard up to 10 minutes...');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (readSecretKey().startsWith('sk_live_')) break;
    tryClipboardImport();
    if (readSecretKey().startsWith('sk_live_')) break;
    if (attempt % 6 === 0 && attempt > 0) {
      console.log('[INFO] Still waiting — run: cd .. && pnpm run import:stripe-live-key (paste dialog)');
    }
    await sleep(5000);
  }

  if (!readSecretKey().startsWith('sk_live_')) {
    console.error('[FAIL] Timed out — sk_live_ not found in .env.stripe.local');
    process.exit(1);
  }

  console.log('[OK] sk_live_ ready in .env.stripe.local');
  runStep('Live Stripe setup', 'pnpm', ['run', 'setup:stripe-live:cli'], WORKSPACE_ROOT);
  runStep('Production redeploy', 'vercel', ['--prod', '--yes'], LIVE_ROOT);
  runStep('Strict billing verify', 'pnpm', ['run', 'verify:stripe-billing', '--', '--strict'], LIVE_ROOT);
  console.log('[OK] Live billing rollout complete');
}

main();
