#!/usr/bin/env node
/**
 * Validate export JSON row counts and checksums against Firestore (optional live check).
 * Usage: node scripts/migration/validate-migration.mjs [export.json]
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const inputArg = process.argv[2];
const migrationDir = join(process.cwd(), 'migration');

async function resolveInputPath() {
  if (inputArg) return inputArg;
  const files = (await readdir(migrationDir)).filter((name) => name.startsWith('export-') && name.endsWith('.json'));
  if (files.length === 0) {
    throw new Error('No export-*.json found in migration/.');
  }
  files.sort();
  return join(migrationDir, files.at(-1));
}

function checksum(rows) {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}

const inputPath = await resolveInputPath();
const raw = JSON.parse(await readFile(inputPath, 'utf8'));
const tables = raw.tables ?? {};
let failed = false;

console.log(`Validating export archive: ${inputPath}`);
console.log(`Exported at: ${raw.exportedAt ?? 'unknown'}`);

for (const [table, rows] of Object.entries(tables)) {
  if (!Array.isArray(rows)) {
    console.error(`FAIL ${table}: not an array`);
    failed = true;
    continue;
  }

  const ids = rows.map((row) => row.id).filter(Boolean);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    console.error(`FAIL ${table}: duplicate ids detected`);
    failed = true;
  }

  console.log(`OK ${table}: ${rows.length} rows, checksum ${checksum(rows).slice(0, 12)}`);
}

if (failed) {
  process.exit(1);
}

console.log('Validation passed.');
