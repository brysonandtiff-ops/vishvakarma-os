#!/usr/bin/env node
/**
 * Verifies production environment template and optional live env files.
 * Run: node scripts/production/verify-env.mjs [--strict]
 */

import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

const strict = process.argv.includes('--strict');

const SUPABASE_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const STRIPE_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STUDIO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
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
  passed = checkKeys(envExample, SUPABASE_KEYS, '.env.example (Supabase)') && passed;
  passed = checkKeys(envExample, ['VITE_STRIPE_BILLING_ENABLED', ...STRIPE_KEYS], '.env.example (Stripe billing)') && passed;

  if (envExample.includes('VITE_STRIPE_BILLING_ENABLED=true')) {
    console.warn('[WARN] .env.example documents Stripe billing keys; ensure server secrets are set before enabling in production');
  }

  if (await fileExists(envLocalPath)) {
    const envLocal = await readFile(envLocalPath, 'utf-8');
    if (strict) {
      passed = checkLiveValues(envLocal, SUPABASE_KEYS, '.env.local (Supabase)') && passed;
    }
  }

  if (!passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
