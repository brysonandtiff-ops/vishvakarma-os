#!/usr/bin/env node
/**
 * Polls .env.stripe.local until STRIPE_SECRET_KEY starts with sk_live_, then runs live setup.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ENV_PATH = join(process.cwd(), '.env.stripe.local');
const MAX_ATTEMPTS = 60;

function readSecretKey() {
  if (!existsSync(ENV_PATH)) return '';
  const match = readFileSync(ENV_PATH, 'utf8').match(/^STRIPE_SECRET_KEY=(\S+)/m);
  return match?.[1] ?? '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('[INFO] Waiting for STRIPE_SECRET_KEY=sk_live_... in .env.stripe.local');
  console.log('[INFO] Paste your live secret key via dialog: pnpm run import:stripe-live-key');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const key = readSecretKey();
    if (key.startsWith('sk_live_')) {
      console.log('[OK] Found sk_live_ in .env.stripe.local — starting live setup...');
      const setup = spawnSync('pnpm', ['run', 'setup:stripe-live:cli'], {
        cwd: join(process.cwd(), '..'),
        encoding: 'utf8',
        shell: true,
        stdio: 'inherit',
      });
      process.exit(setup.status ?? 1);
    }
    await sleep(5000);
  }

  console.error('[FAIL] Timed out waiting for sk_live_ in .env.stripe.local');
  process.exit(1);
}

main();
