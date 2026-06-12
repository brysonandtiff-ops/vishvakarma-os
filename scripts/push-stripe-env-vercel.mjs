#!/usr/bin/env node
/**
 * Reads .env.stripe.local and pushes billing env vars to Vercel production.
 * Usage: node scripts/push-stripe-env-vercel.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const envPath = '.env.stripe.local';
const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STUDIO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'APP_URL',
  'VITE_STRIPE_BILLING_ENABLED',
  'VITE_PRICING_PAGE_ENABLED',
  'VITE_BACKEND_PROVIDER',
  'BACKEND_PROVIDER',
];

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    env[key] = value;
  }
  return env;
}

function pushEnv(name, value) {
  console.log(`[INFO] Setting ${name} on Vercel production...`);
  const result = spawnSync('vercel', ['env', 'add', name, 'production', '--force'], {
    input: value,
    encoding: 'utf8',
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`[FAIL] ${name}: ${result.stderr ?? result.stdout ?? 'unknown error'}`);
    return false;
  }
  console.log(`[OK] ${name}`);
  return true;
}

function main() {
  if (!existsSync(envPath)) {
    console.error(`[FAIL] Missing ${envPath}. Run provision + setup:stripe-live first.`);
    process.exit(1);
  }

  const env = parseEnv(readFileSync(envPath, 'utf8'));
  let ok = true;
  for (const name of required) {
    const value = env[name]?.trim();
    if (!value) {
      console.warn(`[WARN] Skipping ${name} — not set in ${envPath}`);
      ok = false;
      continue;
    }
    ok = pushEnv(name, value) && ok;
  }

  process.exit(ok ? 0 : 1);
}

main();
