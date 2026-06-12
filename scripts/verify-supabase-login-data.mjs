#!/usr/bin/env node
/**
 * Verify Supabase login data path: profile trigger + gateway wiring.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function requireIncludes(file, phrase) {
  const source = read(file);
  if (!source.includes(phrase)) {
    failures.push(`${file} missing: ${phrase}`);
  }
}

requireIncludes('src/contexts/SupabaseAuthProvider.tsx', 'ensureSupabaseProfile');
requireIncludes('src/backend/supabase/supabaseProfileGateway.ts', "from('profiles')");
requireIncludes('src/backend/supabase/supabaseProjectGateway.ts', "from('projects')");
requireIncludes('supabase/migrations/20260212000002_profiles_auth_trigger.sql', 'handle_new_user');
requireIncludes('supabase/migrations/20260212000003_rls_policies.sql', 'profiles_select_own');

if (!existsSync(join(root, 'src/backend/supabase/supabaseClient.ts'))) {
  failures.push('Missing src/backend/supabase/supabaseClient.ts');
}

if (failures.length > 0) {
  console.error('verify-supabase-login-data failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('verify-supabase-login-data passed.');
