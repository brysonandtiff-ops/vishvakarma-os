#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const authPath = join(root, 'src/contexts/AuthContext.tsx');
const firebaseAuthPath = join(root, 'src/backend/firebase/firebaseAuthGateway.ts');
const backendConfigPath = join(root, 'src/backend/backendConfig.ts');

const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

const auth = readRequiredFile(authPath, 'src/contexts/AuthContext.tsx');
const firebaseAuth = readRequiredFile(firebaseAuthPath, 'src/backend/firebase/firebaseAuthGateway.ts');
const backendConfig = readRequiredFile(backendConfigPath, 'src/backend/backendConfig.ts');

const authRequired = [
  'onAuthStateChanged',
  'getRedirectResult',
  'requestFirebaseAccessLink',
  'completeFirebaseEmailLinkSignIn',
  'completeEmailLinkSignIn',
  'emailLinkState',
  'ensureFirestoreProfile',
  'normalizeMagicLinkError',
  "message.includes('fetch failed')",
  "message.includes('failed to fetch')",
  'Magic-link request could not reach Firebase Auth',
];

for (const phrase of authRequired) {
  if (!auth.includes(phrase)) {
    failures.push(`src/contexts/AuthContext.tsx is missing auth handling phrase: ${phrase}`);
  }
}

const firebaseRequired = [
  'FIREBASE_SEND_OOB_CODE_URL',
  'FIREBASE_SIGN_IN_WITH_EMAIL_LINK_URL',
  'sendSignInLinkToEmail',
  'signInWithEmailLink',
  'requestFirebaseAccessLink',
  'completeFirebaseEmailLinkSignIn',
  'resolveFirebaseSessionForFirestore',
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
  'VITE_FIREBASE_API_KEY',
  "provider: 'firebase'",
  'Firebase backend is not configured',
];

for (const phrase of backendRequired) {
  if (!backendConfig.includes(phrase)) {
    failures.push(`src/backend/backendConfig.ts is missing backend phrase: ${phrase}`);
  }
}

if (existsSync(join(root, 'src/db/supabase.ts'))) {
  failures.push('Legacy src/db/supabase.ts still exists — Firebase-only cutover requires its removal.');
}

if (auth.includes('@supabase/supabase-js') || auth.includes("from '@/db/supabase'")) {
  failures.push('AuthContext still imports Supabase client code.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS auth configuration guard check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS auth configuration guard check passed.');
console.log('Firebase magic-link auth configuration handling is guarded.');
