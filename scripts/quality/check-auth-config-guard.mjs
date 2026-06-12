#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const authPath = join(root, 'src/contexts/AuthContext.tsx');
const supabaseAuthPath = join(root, 'src/backend/supabase/supabaseAuthGateway.ts');
const firebaseAuthPath = join(root, 'src/backend/firebase/firebaseAuthGateway.ts');
const backendConfigPath = join(root, 'src/backend/backendConfig.ts');
const supabaseProviderPath = join(root, 'src/contexts/SupabaseAuthProvider.tsx');

const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

const auth = readRequiredFile(authPath, 'src/contexts/AuthContext.tsx');
const supabaseAuth = readRequiredFile(supabaseAuthPath, 'src/backend/supabase/supabaseAuthGateway.ts');
const supabaseProvider = readRequiredFile(supabaseProviderPath, 'src/contexts/SupabaseAuthProvider.tsx');
const firebaseAuth = readRequiredFile(firebaseAuthPath, 'src/backend/firebase/firebaseAuthGateway.ts');
const backendConfig = readRequiredFile(backendConfigPath, 'src/backend/backendConfig.ts');

const authRequired = [
  'SupabaseAuthProvider',
  'FirebaseAuthProvider',
  'completeEmailLinkSignIn',
  'emailLinkState',
  'ensureFirestoreProfile',
  'ensureSupabaseProfile',
  'normalizeMagicLinkError',
  "message.includes('fetch failed')",
  "message.includes('failed to fetch')",
];

const combinedAuthSource = `${auth}\n${supabaseProvider}\n${readRequiredFile(join(root, 'src/backend/supabase/supabaseProfileGateway.ts'), 'supabaseProfileGateway')}`;

for (const phrase of authRequired) {
  if (!combinedAuthSource.includes(phrase)) {
    failures.push(`Auth wiring is missing phrase: ${phrase}`);
  }
}

const supabaseRequired = [
  'requestSupabaseAccessLink',
  'completeSupabaseEmailLinkSignIn',
  'readSupabaseSessionSnapshot',
  'clearSupabaseSessionSnapshot',
  'writeSupabaseSessionSnapshot',
  'signInWithOtp',
  'buildSupabaseSessionFromAuthSession',
];

for (const phrase of supabaseRequired) {
  if (!supabaseAuth.includes(phrase)) {
    failures.push(`src/backend/supabase/supabaseAuthGateway.ts is missing Supabase auth phrase: ${phrase}`);
  }
}

const firebaseRequired = [
  'requestFirebaseAccessLink',
  'completeFirebaseEmailLinkSignIn',
  'readFirebaseSessionSnapshot',
  'clearFirebaseSessionSnapshot',
  'writeFirebaseSessionSnapshot',
];

for (const phrase of firebaseRequired) {
  if (!firebaseAuth.includes(phrase)) {
    failures.push(`src/backend/firebase/firebaseAuthGateway.ts is missing Firebase auth phrase: ${phrase}`);
  }
}

const backendRequired = [
  'VITE_SUPABASE_URL',
  'VITE_BACKEND_PROVIDER',
  'resolveBackendProvider',
  'Supabase backend is not configured',
  'Firebase backend is not configured',
];

for (const phrase of backendRequired) {
  if (!backendConfig.includes(phrase)) {
    failures.push(`src/backend/backendConfig.ts is missing backend phrase: ${phrase}`);
  }
}

if (existsSync(join(root, 'src/db/supabase.ts'))) {
  failures.push('Legacy src/db/supabase.ts exists — use src/backend/supabase/supabaseClient.ts instead.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS auth configuration guard check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS auth configuration guard check passed.');
console.log('Supabase + Firebase auth configuration handling is guarded.');
