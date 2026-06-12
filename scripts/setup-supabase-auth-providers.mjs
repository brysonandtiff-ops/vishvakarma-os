#!/usr/bin/env node
/**
 * Enable Supabase Auth providers (email + Google) on linked project jyocvwipthswfcmvqgqe.
 *
 * - Email: pushed via supabase/config.toml + config push
 * - Google: reuses Firebase Identity Platform google.com IdP credentials when available
 *
 * Run:
 *   node scripts/setup-supabase-auth-providers.mjs
 *   node scripts/setup-supabase-auth-providers.mjs --config-push-only
 */

import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadEnvFile } from './load-env-file.mjs';

const PROJECT_REF = 'jyocvwipthswfcmvqgqe';
const FIREBASE_PROJECT_ID = 'gen-lang-client-0690161780';
const SUPABASE_CALLBACK = `https://${PROJECT_REF}.supabase.co/auth/v1/callback`;
const DEFAULT_GOOGLE_CLIENT_ID =
  '516504852870-e2ch7gpb8cfdb642m7p0os8n6i92nj14.apps.googleusercontent.com';

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env.stripe.local'));

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function getServiceAccountAccessToken(serviceAccount) {
  const header = base64url({ alg: 'RS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  });
  const unsigned = `${header}.${claim}`;
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(serviceAccount.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description ?? payload.error ?? `token exchange ${response.status}`);
  }
  return payload.access_token;
}

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
}

async function fetchFirebaseGoogleIdp(accessToken) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${FIREBASE_PROJECT_ID}/defaultSupportedIdpConfigs/google.com`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firebase google.com IdP: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function ensureSupabaseCallbackOnGoogleClient(accessToken, clientId) {
  const projectNumber = '516504852870';
  const listUrl = `https://content.googleapis.com/v1/projects/${projectNumber}/oauthClients`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    console.warn(
      `[WARN] Could not list Google OAuth clients (${listRes.status}). Add redirect URI manually:`,
      SUPABASE_CALLBACK
    );
    return;
  }

  const payload = await listRes.json();
  const client = payload.oauthClients?.find((entry) => entry.clientId === clientId);
  if (!client?.name) {
    console.warn(`[WARN] OAuth client ${clientId} not found. Add redirect URI manually:`, SUPABASE_CALLBACK);
    return;
  }

  const redirectUris = new Set(client.redirectUris ?? []);
  if (redirectUris.has(SUPABASE_CALLBACK)) {
    console.log('[PASS] Google OAuth client already includes Supabase callback URI');
    return;
  }

  redirectUris.add(SUPABASE_CALLBACK);
  const patchRes = await fetch(`https://content.googleapis.com/v1/${client.name}?updateMask=redirectUris`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ redirectUris: [...redirectUris] }),
  });

  if (!patchRes.ok) {
    console.warn(
      `[WARN] Could not patch Google OAuth redirect URIs (${patchRes.status}). Add manually:`,
      SUPABASE_CALLBACK
    );
    return;
  }

  console.log('[PASS] Added Supabase callback to Google OAuth client redirect URIs');
}

function resolveGoogleCredentials() {
  const clientId = process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID;
  const secret = process.env.SUPABASE_AUTH_GOOGLE_SECRET?.trim();
  if (clientId && secret) {
    return { clientId, secret, source: 'env' };
  }
  return { clientId, secret: null, source: 'pending-firebase' };
}

async function resolveGoogleCredentialsFromFirebase() {
  const existing = resolveGoogleCredentials();
  if (existing.secret) return existing;

  const serviceAccount = readServiceAccount();
  if (!serviceAccount) {
    console.warn('[WARN] No FIREBASE_SERVICE_ACCOUNT_JSON — set SUPABASE_AUTH_GOOGLE_SECRET to enable Google');
    return existing;
  }

  const accessToken = await getServiceAccountAccessToken(serviceAccount);
  const idp = await fetchFirebaseGoogleIdp(accessToken);
  if (!idp?.enabled || !idp.clientId || !idp.clientSecret) {
    console.warn('[WARN] Firebase google.com IdP not enabled or missing secret');
    return existing;
  }

  await ensureSupabaseCallbackOnGoogleClient(accessToken, idp.clientId);
  return { clientId: idp.clientId, secret: idp.clientSecret, source: 'firebase-idp' };
}

function runConfigPush(google) {
  const env = {
    ...process.env,
    SUPABASE_AUTH_GOOGLE_CLIENT_ID: google.clientId,
  };
  if (google.secret) {
    env.SUPABASE_AUTH_GOOGLE_SECRET = google.secret;
  }

  console.log('[INFO] Running supabase config push...');
  const result = spawnSync('npx', ['supabase', 'config', 'push', '--yes'], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    shell: true,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error('supabase config push failed');
  }
}

async function verifyAuthSettings() {
  const url = process.env.VITE_SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  if (!anonKey) {
    console.warn('[WARN] Skipping auth settings probe — anon key not in env');
    return;
  }

  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: { apikey: anonKey },
  });
  const settings = await response.json();
  console.log('[INFO] Remote auth settings:', {
    email: settings.external?.email ?? false,
    google: settings.external?.google ?? false,
    disable_signup: settings.disable_signup ?? null,
  });
}

async function main() {
  const configPushOnly = process.argv.includes('--config-push-only');
  console.log(`[setup] Supabase auth providers for ${PROJECT_REF}`);

  const google = configPushOnly ? resolveGoogleCredentials() : await resolveGoogleCredentialsFromFirebase();
  console.log('[INFO] Google OAuth source:', google.source, google.clientId);

  if (!google.secret) {
    console.warn('[WARN] Google OAuth secret unavailable — email auth will work; Google requires SUPABASE_AUTH_GOOGLE_SECRET');
  }

  runConfigPush(google);
  await verifyAuthSettings();
  console.log('[PASS] Supabase auth provider setup complete');
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
