#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    failures.push(`${label} is missing required hardening phrase: ${phrase}`);
  }
}

function forbidPhrase(content, phrase, label) {
  if (content.includes(phrase)) {
    failures.push(`${label} contains forbidden regression phrase: ${phrase}`);
  }
}

const projectGateway = readRequiredFile(
  join(root, 'src/backend/supabase/supabaseProjectGateway.ts'),
  'src/backend/supabase/supabaseProjectGateway.ts',
);
const collabMigration = readRequiredFile(
  join(root, 'supabase/migrations/20260213000005_collab_and_storage.sql'),
  'supabase/migrations/20260213000005_collab_and_storage.sql',
);
const collabServer = readRequiredFile(join(root, 'server/collab/presenceServer.ts'), 'server/collab/presenceServer.ts');
const packageJson = readRequiredFile(join(root, 'package.json'), 'package.json');

requirePhrase(projectGateway, 'collaborators: [userId]', 'Supabase project gateway');
requirePhrase(projectGateway, 'updateSupabaseProjectCollabSnapshot', 'Supabase project gateway');
requirePhrase(projectGateway, 'getSupabaseProjectCollabSnapshot', 'Supabase project gateway');

requirePhrase(collabMigration, 'collab_snapshot jsonb', 'Supabase collab migration');
requirePhrase(collabMigration, 'collaborators uuid[]', 'Supabase collab migration');
requirePhrase(collabMigration, 'projects_select_member', 'Supabase collab migration');
requirePhrase(collabMigration, "bucket_id = 'materials'", 'Supabase storage migration');

requirePhrase(collabServer, 'function normalizeOrigin', 'Collaboration presence server');
requirePhrase(collabServer, 'ALLOWED_ORIGINS.includes(normalized)', 'Collaboration presence server');
requirePhrase(collabServer, "process.env.ALLOW_MISSING_ORIGIN === 'true'", 'Collaboration presence server');
forbidPhrase(collabServer, 'origin.startsWith(allowed)', 'Collaboration presence server');

requirePhrase(packageJson, '"node": "20.x"', 'package.json');
forbidPhrase(packageJson, '"firebase"', 'package.json');

if (existsSync(join(root, 'firestore.rules'))) {
  failures.push('firestore.rules still exists — Firebase config should be removed.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS production hardening check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS production hardening check passed.');
console.log('Supabase project ownership, collab migration, collab origin checks, and Node runtime pin are guarded.');
