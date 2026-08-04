#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_AUTH_URL,
  CANONICAL_EDITOR_URL,
  CANONICAL_ORIGIN,
} from '../lib/canonical-origin.mjs';

const root = process.cwd();
const failures = [];

function readRequired(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function requirePhrase(source, phrase, label) {
  if (!source.includes(phrase)) {
    failures.push(`${label} is missing required phrase: ${phrase}`);
  }
}

function forbidPhrase(source, phrase, label) {
  if (source.includes(phrase)) {
    failures.push(`${label} contains retired phrase: ${phrase}`);
  }
}

const authContext = readRequired('src/contexts/AuthContext.tsx');
const provider = readRequired('src/contexts/SupabaseAuthProvider.tsx');
const authGateway = readRequired('src/backend/supabase/supabaseAuthGateway.ts');
const lifecycle = readRequired('src/backend/supabase/supabaseAccountLifecycle.ts');
const client = readRequired('src/backend/supabase/supabaseClient.ts');
const backendConfig = readRequired('src/backend/backendConfig.ts');
const routeGuard = readRequired('src/components/common/RouteGuard.tsx');
const authPage = readRequired('src/pages/AuthPage.tsx');
const authCard = readRequired('src/components/auth/AuthLoginCard.tsx');
const resetPage = readRequired('src/pages/ResetPasswordPage.tsx');
const supabaseConfig = readRequired('supabase/config.toml');
const hostedSetup = readRequired('scripts/setup-supabase-auth-hardening.mjs');
const canonicalConfig = readRequired('src/config/canonicalOrigin.ts');

for (const phrase of ['SupabaseAuthProvider', 'provider: \'supabase\'']) {
  requirePhrase(`${authContext}\n${backendConfig}`, phrase, 'Supabase auth boundary');
}
forbidPhrase(authContext, 'FirebaseAuthProvider', 'AuthContext');
forbidPhrase(authContext, 'firebaseAuthGateway', 'AuthContext');

for (const phrase of [
  'hydrateSupabaseAuthSession',
  'signInWithPasswordSupabase',
  'POST_AUTH_DESTINATION',
  'INITIAL_SESSION',
]) {
  requirePhrase(provider, phrase, 'SupabaseAuthProvider');
}

for (const phrase of [
  'client.auth.signInWithPassword',
  'client.auth.getSession',
  'clearLegacyTokenSnapshot',
  'buildAuthorizedSessionOrSignOut',
]) {
  requirePhrase(authGateway, phrase, 'Supabase auth gateway');
}

for (const phrase of [
  'client.auth.signUp',
  'client.auth.resetPasswordForEmail',
  'client.auth.exchangeCodeForSession',
  'client.auth.updateUser',
  'client.auth.signOut',
  'MIN_ACCOUNT_PASSWORD_LENGTH = 12',
]) {
  requirePhrase(lifecycle, phrase, 'Supabase account lifecycle');
}

for (const phrase of [
  'handleSupabaseSignIn',
  'handleCreateAccount',
  'handleForgotPassword',
  'createSupabaseAccount',
]) {
  requirePhrase(authPage, phrase, 'Auth page');
}
forbidPhrase(authPage, 'signInWithGoogle', 'Auth page');
forbidPhrase(authPage, 'requestAccessLink', 'Auth page');

for (const phrase of [
  'supabase-auth-badge',
  'auth-mode-create-account',
  'supabase-confirm-password-input',
  'supabase-create-account-button',
  'supabase-forgot-password-button',
]) {
  requirePhrase(authCard, phrase, 'Auth card');
}
forbidPhrase(authCard, 'google-sso-button', 'Auth card');
forbidPhrase(authCard, 'email-magic-link-button', 'Auth card');

for (const phrase of [
  'recovery-email-input',
  'recovery-send-email-button',
  'recovery-new-password-input',
  'recovery-update-password-button',
  'getSupabaseRecoverySession',
]) {
  requirePhrase(resetPage, phrase, 'Reset password page');
}
forbidPhrase(resetPage, 'password-reset-unavailable', 'Reset password page');

const siteUrl = supabaseConfig.match(/site_url\s*=\s*"([^"]+)"/)?.[1] ?? '';
if (siteUrl !== CANONICAL_ORIGIN) {
  failures.push(
    `supabase/config.toml site_url must be ${CANONICAL_ORIGIN} (found ${siteUrl || 'missing'})`,
  );
}
for (const required of [CANONICAL_AUTH_URL, CANONICAL_EDITOR_URL, `${CANONICAL_ORIGIN}/reset-password`]) {
  requirePhrase(supabaseConfig, required, 'Supabase redirect allow-list');
}
requirePhrase(supabaseConfig, '[auth.email]\nenable_signup = true', 'Supabase config');
requirePhrase(supabaseConfig, 'enable_confirmations = true', 'Supabase config');
requirePhrase(supabaseConfig, '[auth.external.google]\nenabled = false', 'Supabase config');

for (const phrase of [
  'external_email_enabled: true',
  'disable_signup: false',
  'mailer_autoconfirm: false',
  'external_google_enabled: false',
  'mailer_subjects_confirmation',
  'mailer_subjects_recovery',
]) {
  requirePhrase(hostedSetup, phrase, 'Hosted Supabase setup');
}

requirePhrase(client, 'detectSessionInUrl: false', 'Supabase client');
requirePhrase(routeGuard, 'hasCachedAuthSession', 'RouteGuard');
requirePhrase(backendConfig, 'VITE_SUPABASE_URL', 'Backend config');
requirePhrase(backendConfig, 'VITE_SUPABASE_ANON_KEY', 'Backend config');
requirePhrase(canonicalConfig, CANONICAL_ORIGIN, 'Canonical origin config');

if (existsSync(join(root, 'src/backend/firebase'))) {
  failures.push('Legacy src/backend/firebase still exists.');
}
if (existsSync(join(root, 'src/db/supabase.ts'))) {
  failures.push('Legacy src/db/supabase.ts exists; use the backend Supabase client.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS auth configuration guard check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS auth configuration guard check passed.');
console.log('Signup, confirmation, recovery, password update, redirects, and Supabase-only policy are guarded.');
console.log(`Canonical auth origin: ${CANONICAL_ORIGIN}`);
