#!/usr/bin/env node
/**
 * Reads live/test secret key from Stripe CLI config.toml for setup scripts.
 * Usage: node scripts/extract-stripe-cli-key.mjs [--live|--test]
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const live = process.argv.includes('--live') || !process.argv.includes('--test');
const configPath = join(homedir(), '.config', 'stripe', 'config.toml');

if (!existsSync(configPath)) {
  console.error('[FAIL] Stripe CLI config not found. Run: node scripts/stripe-cli-login.mjs');
  process.exit(1);
}

const content = readFileSync(configPath, 'utf8');
const section = content.match(/\[default\][\s\S]*?(?=\n\[|$)/)?.[0] ?? content;
const keyName = live ? 'live_mode_api_key' : 'test_mode_api_key';
const match = section.match(new RegExp(`${keyName}\\s*=\\s*'([^']+)'`));

if (!match?.[1] || match[1].includes('*')) {
  console.error(`[FAIL] ${keyName} missing or redacted in Stripe CLI config. Re-run: node scripts/stripe-cli-login.mjs`);
  process.exit(1);
}

process.stdout.write(match[1]);
