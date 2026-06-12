#!/usr/bin/env node
/**
 * Verify Supabase archive schema: migration files on disk + optional live PostgREST check.
 *
 * Static mode (default): asserts migrations exist and match export-supabase.mjs table list.
 * Live mode (--live): requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; probes each table.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const migrationsDir = join(root, 'supabase', 'migrations');
const exportScript = join(root, 'scripts', 'migration', 'export-supabase.mjs');

const EXPECTED_TABLES = [
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

const REQUIRED_MIGRATION_FRAGMENTS = [
  'create table if not exists public.profiles',
  'handle_new_user',
  'enable row level security',
  'profiles_select_own',
];

const live = process.argv.includes('--live');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(path, 'utf8');
}

if (!existsSync(migrationsDir)) {
  fail('Missing supabase/migrations/ directory');
} else {
  const sqlFiles = readdirSync(migrationsDir).filter((name) => name.endsWith('.sql'));
  if (sqlFiles.length < 3) {
    fail(`Expected at least 3 migration SQL files, found ${sqlFiles.length}`);
  }

  const combined = sqlFiles.map((name) => read(join(migrationsDir, name))).join('\n');

  for (const table of EXPECTED_TABLES) {
    if (!combined.includes(`public.${table}`)) {
      fail(`Migration SQL missing public.${table}`);
    }
  }

  for (const fragment of REQUIRED_MIGRATION_FRAGMENTS) {
    if (!combined.includes(fragment)) {
      fail(`Migration SQL missing required fragment: ${fragment}`);
    }
  }
}

if (existsSync(exportScript)) {
  const exportSource = read(exportScript);
  for (const table of EXPECTED_TABLES) {
    if (!exportSource.includes(`'${table}'`)) {
      fail(`export-supabase.mjs missing table: ${table}`);
    }
  }
} else {
  fail('Missing scripts/migration/export-supabase.mjs');
}

if (live) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    fail('Live check requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  } else {
    for (const table of EXPECTED_TABLES) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });

        if (!response.ok) {
          const body = await response.text();
          fail(`Live probe failed for ${table}: ${response.status} ${body.slice(0, 200)}`);
        } else {
          console.log(`OK live ${table}: reachable`);
        }
      } catch (error) {
        fail(`Live probe error for ${table}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      const profileProbe = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role,created_at,updated_at&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      if (!profileProbe.ok) {
        const body = await profileProbe.text();
        fail(`profiles column probe failed: ${profileProbe.status} ${body.slice(0, 200)}`);
      } else {
        console.log('OK live profiles: login columns selectable');
      }
    } catch (error) {
      fail(`profiles column probe error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} else {
  console.log('Static Supabase schema guard passed (use --live with env vars for remote probe).');
}

if (failures.length > 0) {
  console.error('Supabase schema verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Supabase schema verification passed.');
console.log(`Tables guarded: ${EXPECTED_TABLES.join(', ')}`);
