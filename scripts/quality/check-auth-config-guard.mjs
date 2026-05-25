#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const supabasePath = join(root, 'src/db/supabase.ts');
const authPath = join(root, 'src/contexts/AuthContext.tsx');

const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

const supabase = readRequiredFile(supabasePath, 'src/db/supabase.ts');
const auth = readRequiredFile(authPath, 'src/contexts/AuthContext.tsx');

const supabaseRequired = [
  'isPlaceholderValue',
  "normalized.includes('your-project')",
  "normalized.includes('your-supabase')",
  'getSupabaseConfigurationError',
  'Supabase is not configured for magic-link access',
];

for (const phrase of supabaseRequired) {
  if (!supabase.includes(phrase)) {
    failures.push(`src/db/supabase.ts is missing guard phrase: ${phrase}`);
  }
}

const authRequired = [
  'getSupabaseConfigurationError',
  'normalizeMagicLinkError',
  "message.includes('fetch failed')",
  "message.includes('failed to fetch')",
  'Magic-link request could not reach Supabase',
];

for (const phrase of authRequired) {
  if (!auth.includes(phrase)) {
    failures.push(`src/contexts/AuthContext.tsx is missing auth handling phrase: ${phrase}`);
  }
}

if (auth.includes("throw new Error('Supabase is not configured. Add environment variables to enable account access.')")) {
  failures.push('AuthContext still contains the old generic Supabase configuration error.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS auth configuration guard check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS auth configuration guard check passed.');
console.log('Magic-link placeholder config and fetch-failure handling are guarded.');
