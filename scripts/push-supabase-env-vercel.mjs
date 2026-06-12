#!/usr/bin/env node
/**
 * Reads .env.supabase.local and pushes Supabase auth env vars to Vercel production + preview.
 * Usage: node scripts/push-supabase-env-vercel.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const envPath = '.env.supabase.local';
const required = [
  'VITE_BACKEND_PROVIDER',
  'BACKEND_PROVIDER',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_PRICING_PAGE_ENABLED',
];

const targets = ['production', 'preview'];

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function runVercel(args) {
  const result = spawnSync('vercel', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function pushEnv(name, value, target) {
  console.log(`[INFO] Setting ${name} on Vercel ${target}...`);

  const add = runVercel(['env', 'add', name, target, '--value', value, '--yes', '--force']);
  if (add.ok || add.output.includes('Overrode Environment Variable')) {
    console.log(`[OK] ${name} (${target})`);
    return true;
  }

  const update = runVercel(['env', 'update', name, target, '--value', value, '--yes']);
  if (update.ok || update.output.includes('Updated Environment Variable')) {
    console.log(`[OK] ${name} (${target}) [updated]`);
    return true;
  }

  console.error(`[FAIL] ${name} (${target}): ${update.output || add.output || 'unknown error'}`);
  return false;
}

function main() {
  if (!existsSync(envPath)) {
    console.error(`[FAIL] Missing ${envPath}. Copy .env.supabase.local.example and fill in keys.`);
    process.exit(1);
  }

  const env = parseEnv(readFileSync(envPath, 'utf8'));
  let ok = true;
  for (const target of targets) {
    for (const name of required) {
      const value = env[name]?.trim();
      if (!value) {
        console.warn(`[WARN] Skipping ${name} — not set in ${envPath}`);
        ok = false;
        continue;
      }
      ok = pushEnv(name, value, target) && ok;
    }
  }

  process.exit(ok ? 0 : 1);
}

main();
