#!/usr/bin/env node
/**
 * Verifies production environment template and optional live env files.
 * Run: node scripts/production/verify-env.mjs [--strict]
 */

import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

const strict = process.argv.includes('--strict');

const FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const STRIPE_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STUDIO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
];

async function fileExists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function checkKeys(content, keys, label) {
  const missing = keys.filter((key) => !content.includes(key));
  if (missing.length > 0) {
    console.error(`[FAIL] ${label} missing keys: ${missing.join(', ')}`);
    return false;
  }
  console.log(`[PASS] ${label} documents required keys`);
  return true;
}

function checkLiveValues(content, keys, label) {
  let ok = true;
  for (const key of keys) {
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    const value = match?.[1]?.trim() ?? '';
    if (!value || value.includes('your-') || value.includes('placeholder')) {
      console.warn(`[WARN] ${label} ${key} is not configured for production`);
      ok = false;
    }
  }
  if (ok) {
    console.log(`[PASS] ${label} live values appear configured`);
  }
  return ok;
}

async function main() {
  const root = process.cwd();
  const envExamplePath = join(root, '.env.example');
  const envLocalPath = join(root, '.env.local');

  if (!(await fileExists(envExamplePath))) {
    console.error('[FAIL] .env.example is missing');
    process.exit(1);
  }

  const envExample = await readFile(envExamplePath, 'utf-8');
  let passed = true;
  passed = checkKeys(envExample, FIREBASE_KEYS, '.env.example (Firebase)') && passed;
  passed = checkKeys(envExample, ['VITE_STRIPE_BILLING_ENABLED', ...STRIPE_KEYS], '.env.example (Stripe billing)') && passed;

  if (envExample.includes('VITE_STRIPE_BILLING_ENABLED=true')) {
    console.warn('[WARN] .env.example documents Stripe billing keys; ensure server secrets are set before enabling in production');
  }

  if (strict && (await fileExists(envLocalPath))) {
    const envLocal = await readFile(envLocalPath, 'utf-8');
    passed = checkLiveValues(envLocal, FIREBASE_KEYS, '.env.local') && passed;
  } else if (strict) {
    console.warn('[WARN] --strict: .env.local not found; skipping live value checks');
  }

  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error('[FAIL]', error);
  process.exit(1);
});
