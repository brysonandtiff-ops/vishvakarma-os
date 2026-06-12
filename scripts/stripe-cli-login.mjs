#!/usr/bin/env node
/**
 * Completes Stripe CLI login by opening the confirm URL in the default browser.
 * Usage: node scripts/stripe-cli-login.mjs [--live]
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const live = process.argv.includes('--live');
const stripeArgs = ['-y', '@stripe/cli', 'login', '--interactive'];

function runStripe(args, input) {
  return spawnSync('npx', args, {
    encoding: 'utf8',
    shell: true,
    input,
  });
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', url], { shell: true });
    return;
  }
  if (process.platform === 'darwin') {
    spawnSync('open', [url]);
    return;
  }
  spawnSync('xdg-open', [url]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[INFO] Starting Stripe CLI login${live ? ' (live mode)' : ''}...`);
  const start = runStripe(stripeArgs);
  process.stdout.write(start.stdout ?? '');
  process.stderr.write(start.stderr ?? '');

  let payload;
  try {
    payload = JSON.parse((start.stdout ?? '').trim());
  } catch {
    throw new Error('Stripe CLI did not return JSON. Install/login may have failed.');
  }

  if (payload.browser_url) {
    console.log('[INFO] Opening Stripe confirmation in your default browser...');
    openBrowser(payload.browser_url);
  }

  const completeUrl = payload.next_step?.match(/stripe login --complete '([^']+)'/)?.[1];
  if (!completeUrl) {
    throw new Error('Stripe CLI response missing login --complete URL');
  }

  console.log('[INFO] Waiting for browser confirmation (up to 120s)...');
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await sleep(5000);
    const complete = runStripe(
      ['-y', '@stripe/cli', 'login', '--complete', completeUrl],
      undefined
    );
    if (complete.status === 0) {
      process.stdout.write(complete.stdout ?? '');
      console.log('[OK] Stripe CLI login complete');
      const configPath = join(homedir(), '.config', 'stripe', 'config.toml');
      if (existsSync(configPath)) {
        console.log(`[OK] Config written: ${configPath}`);
      }
      return;
    }
  }

  throw new Error('Timed out waiting for Stripe CLI browser confirmation');
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
