import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

const EXPECTED_TABLES = [
  'profiles',
  'projects',
  'specs',
  'registry',
  'change_requests',
  'releases',
  'audit_logs',
  'route_manifest',
];

describe('login data setup', () => {
  it('keeps Supabase migration files for all export tables', () => {
    const migrationsDir = resolve(repoRoot, 'supabase/migrations');
    expect(existsSync(migrationsDir)).toBe(true);

    const sqlFiles = readdirSync(migrationsDir).filter((name) => name.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThanOrEqual(3);

    const combined = sqlFiles.map((name) => read(`supabase/migrations/${name}`)).join('\n');
    for (const table of EXPECTED_TABLES) {
      expect(combined).toContain(`public.${table}`);
    }

    expect(combined).toContain('handle_new_user');
    expect(combined).toContain('enable row level security');
  });

  it('aligns export-supabase.mjs table list with migrations', () => {
    const exportScript = read('scripts/migration/export-supabase.mjs');
    for (const table of EXPECTED_TABLES) {
      expect(exportScript).toContain(`'${table}'`);
    }
  });

  it('matches Firebase profile gateway fields to Profile type usage', () => {
    const gateway = read('src/backend/firebase/firestoreProfileGateway.ts');
    const profileType = read('src/types/index.ts');

    expect(profileType).toContain('export interface Profile');
    expect(gateway).toContain('full_name');
    expect(gateway).toContain('role');
    expect(gateway).toContain('email');
    expect(gateway).toContain('created_at');
    expect(gateway).toContain('updated_at');
  });

  it('documents verify scripts for login data', () => {
    expect(existsSync(resolve(repoRoot, 'scripts/verify-supabase-schema.mjs'))).toBe(true);
    expect(existsSync(resolve(repoRoot, 'scripts/verify-firebase-login-data.mjs'))).toBe(true);

    const pkg = read('package.json');
    expect(pkg).toContain('verify:supabase-schema');
    expect(pkg).toContain('verify:firebase-login-data');
  });
});
