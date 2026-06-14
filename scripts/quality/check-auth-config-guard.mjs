#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANONICAL_AUTH_URL, CANONICAL_EDITOR_URL, CANONICAL_ORIGIN } from '../lib/canonical-origin.mjs';

const root = process.cwd();
const authPath = join(root, 'src/contexts/AuthContext.tsx');
const supabaseAuthPath = join(root, 'src/backend/supabase/supabaseAuthGateway.ts');
const supabaseOAuthPath = join(root, 'src/backend/supabase/supabaseOAuthGateway.ts');
const backendConfigPath = join(root, 'src/backend/backendConfig.ts');
const supabaseProviderPath = join(root, 'src/contexts/SupabaseAuthProvider.tsx');
const supabaseConfigPath = join(root, 'supabase/config.toml');
const canonicalOriginPath = join(root, 'src/config/canonicalOrigin.ts');

const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

function checkSupabaseConfig() {
  const config = readRequiredFile(supabaseConfigPath, 'supabase/config.toml');
  if (!config) return;

  const siteUrlMatch = config.match(/site_url\s*=\s*"([^"]+)"/);
  const siteUrl = siteUrlMatch?.[1] ?? '';
  if (siteUrl !== CANONICAL_ORIGIN) {
    failures.push(
      `supabase/config.toml site_url must be ${CANONICAL_ORIGIN} (found ${siteUrl || 'missing'})`
    );
  }

  for (const required of [CANONICAL_AUTH_URL, CANONICAL_EDITOR_URL]) {
    if (!config.includes(required)) {
      failures.push(`supabase/config.toml missing redirect URL: ${required}`);
    }
  }
}

function checkGatewayCanonicalFallbacks() {
  const oauth = readRequiredFile(supabaseOAuthPath, 'src/backend/supabase/supabaseOAuthGateway.ts');
  const auth = readRequiredFile(supabaseAuthPath, 'src/backend/supabase/supabaseAuthGateway.ts');
  const canonical = readRequiredFile(canonicalOriginPath, 'src/config/canonicalOrigin.ts');
  const supabaseClientPath = join(root, 'src/backend/supabase/supabaseClient.ts');
  const supabaseClient = readRequiredFile(supabaseClientPath, 'src/backend/supabase/supabaseClient.ts');

  if (oauth.includes("'https://vishvakarma-os.vercel.app'")) {
    failures.push('supabaseOAuthGateway.ts must not hardcode Vercel as primary auth origin');
  }
  if (auth.includes("'https://vishvakarma-os.vercel.app/auth'")) {
    failures.push('supabaseAuthGateway.ts must not hardcode Vercel as primary auth URL');
  }
  if (!oauth.includes('CANONICAL_ORIGIN') || !auth.includes('CANONICAL_AUTH_URL')) {
    failures.push('Supabase auth gateways must import canonical origin constants');
  }
  if (!canonical.includes(CANONICAL_ORIGIN)) {
    failures.push('src/config/canonicalOrigin.ts missing canonical origin constant');
  }
  if (!oauth.includes('completePostAuthRedirect')) {
    failures.push('supabaseOAuthGateway.ts must export completePostAuthRedirect for OAuth callback landing');
  }
  if (!oauth.includes("POST_AUTH_DESTINATION = '/editor'")) {
    failures.push("supabaseOAuthGateway.ts POST_AUTH_DESTINATION must be '/editor'");
  }
  if (!supabaseClient.includes('detectSessionInUrl: false')) {
    failures.push('supabaseClient.ts must disable detectSessionInUrl — PKCE exchange is handled in supabaseOAuthGateway');
  }
}

const auth = readRequiredFile(authPath, 'src/contexts/AuthContext.tsx');
const supabaseAuth = readRequiredFile(supabaseAuthPath, 'src/backend/supabase/supabaseAuthGateway.ts');
const supabaseProvider = readRequiredFile(supabaseProviderPath, 'src/contexts/SupabaseAuthProvider.tsx');
const backendConfig = readRequiredFile(backendConfigPath, 'src/backend/backendConfig.ts');

const authRequired = [
  'SupabaseAuthProvider',
  'completeEmailLinkSignIn',
  'emailLinkState',
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

if (auth.includes('FirebaseAuthProvider') || auth.includes('firebaseAuthGateway')) {
  failures.push('AuthContext still references Firebase — Supabase-only cutover required.');
}

const supabaseRequired = [
  'requestSupabaseAccessLink',
  'completeSupabaseEmailLinkSignIn',
  'readSupabaseSessionSnapshot',
  'clearSupabaseSessionSnapshot',
  'writeSupabaseSessionSnapshot',
  'signInWithOtp',
  'buildSupabaseSessionFromAuthSession',
  'isSupabaseOAuthCallback',
];

for (const phrase of supabaseRequired) {
  if (!supabaseAuth.includes(phrase)) {
    failures.push(`src/backend/supabase/supabaseAuthGateway.ts is missing Supabase auth phrase: ${phrase}`);
  }
}

const backendRequired = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'Supabase backend is not configured',
  "provider: 'supabase'",
];

for (const phrase of backendRequired) {
  if (!backendConfig.includes(phrase)) {
    failures.push(`src/backend/backendConfig.ts is missing backend phrase: ${phrase}`);
  }
}

if (existsSync(join(root, 'src/backend/firebase'))) {
  failures.push('Legacy src/backend/firebase still exists — remove Firebase backend directory.');
}

if (existsSync(join(root, 'src/db/supabase.ts'))) {
  failures.push('Legacy src/db/supabase.ts exists — use src/backend/supabase/supabaseClient.ts instead.');
}

const supabaseProviderRequired = [
  'completePostAuthRedirect',
  'POST_AUTH_DESTINATION',
  'INITIAL_SESSION',
];

for (const phrase of supabaseProviderRequired) {
  if (!supabaseProvider.includes(phrase)) {
    failures.push(`src/contexts/SupabaseAuthProvider.tsx is missing auth phrase: ${phrase}`);
  }
}

checkSupabaseConfig();
checkGatewayCanonicalFallbacks();

if (failures.length > 0) {
  console.error('Vishvakarma.OS auth configuration guard check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS auth configuration guard check passed.');
console.log('Supabase-only auth configuration handling is guarded.');
console.log(`Canonical auth origin: ${CANONICAL_ORIGIN}`);
