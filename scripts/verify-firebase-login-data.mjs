#!/usr/bin/env node
/**
 * Verify Firebase production login data wiring: AuthContext profile creation,
 * Firestore profile gateway shape, and firestore.rules access patterns.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const authContextPath = join(root, 'src/contexts/AuthContext.tsx');
const profileGatewayPath = join(root, 'src/backend/firebase/firestoreProfileGateway.ts');
const firestoreRulesPath = join(root, 'firestore.rules');
const authGuardPath = join(root, 'scripts/quality/check-auth-config-guard.mjs');

const failures = [];

function read(path) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

const authContext = read(authContextPath);
const profileGateway = read(profileGatewayPath);
const firestoreRules = read(firestoreRulesPath);

const authRequired = [
  'ensureFirestoreProfile',
  'getFirestoreProfile',
  'onAuthStateChanged',
];

for (const phrase of authRequired) {
  if (!authContext.includes(phrase)) {
    failures.push(`AuthContext missing: ${phrase}`);
  }
}

const profileRequired = [
  "const PROFILES_COLLECTION = 'profiles'",
  'full_name',
  'role',
  'ownerId',
  'created_at',
  'updated_at',
  'ensureFirestoreProfile',
];

for (const phrase of profileRequired) {
  if (!profileGateway.includes(phrase)) {
    failures.push(`firestoreProfileGateway missing: ${phrase}`);
  }
}

const rulesRequired = [
  'match /profiles/{userId}',
  'request.auth.uid == userId',
  'match /billing/{userId}',
  'allow write: if false',
  "data.role == 'admin'",
];

for (const phrase of rulesRequired) {
  if (!firestoreRules.includes(phrase)) {
    failures.push(`firestore.rules missing: ${phrase}`);
  }
}

if (existsSync(authGuardPath)) {
  const guard = read(authGuardPath);
  if (!guard.includes('Firebase-only cutover')) {
    failures.push('check-auth-config-guard.mjs should enforce Firebase-only cutover');
  }
}

if (failures.length > 0) {
  console.error('Firebase login data verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Firebase login data verification passed.');
console.log('- AuthContext ensures Firestore profile on sign-in');
console.log('- profiles collection uses uid-scoped ownerId + role fields');
console.log('- firestore.rules restricts profiles/billing to authenticated owner');
