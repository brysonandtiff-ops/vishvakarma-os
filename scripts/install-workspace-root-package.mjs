#!/usr/bin/env node
/**
 * Writes a valid delegating package.json one level above vishvakarma-os-live so
 * parent-folder pnpm commands keep working. This also repairs hand-written or
 * previously generated JSON with trailing commas.
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const liveRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = join(liveRoot, '..');
const target = join(workspaceRoot, 'package.json');

const payload = {
  name: 'vishvakarma-os-workspace',
  private: true,
  packageManager: 'pnpm@9.15.0',
  scripts: {
    'setup:stripe-live': 'pnpm --dir vishvakarma-os-live run setup:stripe-live',
    'setup:stripe-live:cli': 'pnpm --dir vishvakarma-os-live run setup:stripe-live:cli',
    'setup:stripe': 'pnpm --dir vishvakarma-os-live run setup:stripe',
    'verify:stripe-billing': 'pnpm --dir vishvakarma-os-live run verify:stripe-billing',
    'fetch:stripe-live-key': 'pnpm --dir vishvakarma-os-live exec node scripts/fetch-stripe-live-key.mjs',
    'import:stripe-live-key': 'pnpm --dir vishvakarma-os-live exec node scripts/import-stripe-live-key-from-clipboard.mjs',
  },
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

function isSameWorkspacePackage(value) {
  return JSON.stringify(value) === JSON.stringify(payload);
}

if (existsSync(target)) {
  try {
    const existing = JSON.parse(readFileSync(target, 'utf8'));
    if (isSameWorkspacePackage(existing)) {
      console.log(`[OK] Workspace root package is already valid: ${target}`);
      process.exit(0);
    }

    if (existing?.name !== payload.name) {
      console.warn(`[WARN] Replacing non-standard parent package.json at ${target}`);
    } else {
      console.log(`[FIX] Refreshing stale parent package.json at ${target}`);
    }
  } catch (error) {
    console.warn(`[FIX] Replacing invalid parent package.json at ${target}`);
    console.warn(`      ${error instanceof Error ? error.message : error}`);
  }
}

writeFileSync(target, serialized, 'utf8');
console.log(`[OK] Wrote valid workspace root package.json: ${target}`);
