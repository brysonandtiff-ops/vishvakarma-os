#!/usr/bin/env node
/**
 * Completes Stripe CLI login by opening the confirm URL in Chrome (or default browser).
 * Usage: node scripts/stripe-cli-login.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { openExternalUrl, resolveChromeExecutable } from './open-external-url.mjs';

function runStripe(args) {
  return spawnSync('npx', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printManualFallback(payload) {
  console.log('');
  console.log('If the browser did not open automatically, use one of these:');
  if (payload.browser_url) {
    console.log(`  Confirm URL: ${payload.browser_url}`);
  }
  if (payload.verification_code) {
    console.log(`  Pairing code: ${payload.verification_code}`);
  }
  console.log('');
  console.log('Or open Chrome manually:');
  console.log(`  node scripts/open-external-url.mjs "${payload.browser_url ?? ''}"`);
  console.log('');
}

async function main() {
  const chrome = resolveChromeExecutable();
  console.log('[INFO] Starting Stripe CLI login...');
  if (chrome) {
    console.log(`[INFO] Will open confirmation in Chrome (${chrome})`);
  } else {
    console.log('[INFO] Chrome not found — will use the default system browser');
    console.log('[INFO] Set CHROME_PATH to force a specific Chrome executable');
  }

  const start = runStripe(['-y', '@stripe/cli', 'login', '--interactive']);
  if (start.stdout) process.stdout.write(start.stdout);
  if (start.stderr) process.stderr.write(start.stderr);
  if (start.status !== 0) {
    throw new Error(start.stderr?.trim() || start.stdout?.trim() || 'Stripe CLI login failed to start');
  }

  let payload;
  try {
    payload = JSON.parse((start.stdout ?? '').trim());
  } catch {
    throw new Error('Stripe CLI did not return JSON. Install/login may have failed.');
  }

  const completeUrl = payload.next_step?.match(/stripe login --complete '([^']+)'/)?.[1];
  if (!completeUrl) {
    throw new Error('Stripe CLI response missing login --complete URL');
  }

  if (payload.browser_url) {
    const opened = openExternalUrl(payload.browser_url, { preferChrome: true });
    if (opened.ok) {
      console.log(`[OK] Opened Stripe confirmation (${opened.method})`);
    } else {
      console.warn(`[WARN] Could not auto-open browser: ${opened.error ?? 'unknown error'}`);
    }
    printManualFallback(payload);
  }

  console.log('[INFO] In Chrome, sign in if needed and click Allow access.');
  console.log('[INFO] Waiting for browser confirmation (up to 3 minutes)...');

  for (let attempt = 0; attempt < 36; attempt += 1) {
    await sleep(5000);
    const complete = runStripe(['-y', '@stripe/cli', 'login', '--complete', completeUrl]);
    if (complete.status === 0) {
      if (complete.stdout) process.stdout.write(complete.stdout);
      console.log('[OK] Stripe CLI login complete');
      const configPath = join(homedir(), '.config', 'stripe', 'config.toml');
      if (existsSync(configPath)) {
        console.log(`[OK] Config written: ${configPath}`);
      }
      return;
    }
  }

  printManualFallback(payload);
  throw new Error('Timed out waiting for Stripe CLI browser confirmation');
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
