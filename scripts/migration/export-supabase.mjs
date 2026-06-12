#!/usr/bin/env node
/**
 * Export Supabase Postgres tables to JSON for Firebase cutover.
 * Requires: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TABLES = [
  'profiles',
  'projects',
  'specs',
  'registry',
  'change_requests',
  'releases',
  'audit_logs',
  'route_manifest',
  'billing',
  'optimization_batches',
];

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running export-supabase.mjs');
  process.exit(1);
}

async function fetchTable(table) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export ${table}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

const exportedAt = new Date().toISOString();
const payload = { exportedAt, source: supabaseUrl, tables: {} };

for (const table of TABLES) {
  payload.tables[table] = await fetchTable(table);
  console.log(`Exported ${table}: ${payload.tables[table].length} rows`);
}

const outDir = join(process.cwd(), 'migration');
await mkdir(outDir, { recursive: true });
const fileName = `export-${exportedAt.replace(/[:.]/g, '-')}.json`;
const outPath = join(outDir, fileName);
await writeFile(outPath, JSON.stringify(payload, null, 2));

console.log(`Wrote ${outPath}`);
