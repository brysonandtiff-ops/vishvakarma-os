#!/usr/bin/env node
/**
 * Saves sk_live_ from clipboard (Windows/macOS) into .env.stripe.local.
 * Usage: copy sk_live_... then node scripts/import-stripe-live-key-from-clipboard.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function readClipboard() {
  if (process.platform === 'win32') {
    const clip = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], {
      encoding: 'utf8',
    });
    return clip.stdout?.trim() ?? '';
  }
  if (process.platform === 'darwin') {
    const clip = spawnSync('pbpaste', [], { encoding: 'utf8' });
    return clip.stdout?.trim() ?? '';
  }
  throw new Error('Clipboard import is supported on Windows and macOS only.');
}

if (!existsSync('.env.stripe.local')) {
  console.error('[FAIL] Missing .env.stripe.local — run provision:firebase-service-account first.');
  process.exit(1);
}

const key = readClipboard();
if (!key.startsWith('sk_live_')) {
  console.error('[FAIL] Clipboard does not contain sk_live_... Copy it from Stripe Dashboard → API keys first.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['scripts/set-stripe-secret-env.mjs', key], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 0);
