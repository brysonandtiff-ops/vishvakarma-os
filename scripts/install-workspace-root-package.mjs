#!/usr/bin/env node
/**
 * Writes a delegating package.json one level above vishvakarma-os-live so
 * `pnpm run setup:stripe-live:cli` works from the Vishvakarma-os parent folder.
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

if (existsSync(target)) {
  try {
    const existing = JSON.parse(readFileSync(target, 'utf8'));
    if (existing.name === payload.name) {
      console.log(`[OK] Workspace root already present: ${target}`);
      process.exit(0);
    }
  } catch {
    // overwrite invalid json
  }
}

writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`[OK] Wrote ${target}`);
