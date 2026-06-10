#!/usr/bin/env node
/**
 * Enable Google and (optionally) Apple OAuth via Identity Platform Admin API.
 * Google: uses FIREBASE_GOOGLE_OAUTH_CLIENT_ID or auto-fetches web client from GCP.
 * Apple: requires FIREBASE_APPLE_TEAM_ID, FIREBASE_APPLE_KEY_ID, FIREBASE_APPLE_PRIVATE_KEY.
 *
 * Run: node scripts/setup-firebase-oauth-providers.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const PROJECT_ID = 'gen-lang-client-0690161780';
const WEB_APP_ID = '1:516504852870:web:33338f087485a0b553f407';
const API_BASE = 'https://identitytoolkit.googleapis.com/admin/v2';

function getAccessToken() {
  const configPaths = [
    join(process.env.APPDATA ?? '', 'configstore', 'firebase-tools.json'),
    join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.config', 'configstore', 'firebase-tools.json'),
  ];

  for (const path of configPaths) {
    try {
      const raw = readFileSync(path, 'utf8');
      const parsed = JSON.parse(raw);
      const tokens = parsed?.tokens;
      if (tokens?.access_token) {
        const expires = tokens.expires_at ?? 0;
        if (Date.now() < expires - 60_000) return tokens.access_token;
      }
    } catch {
      // try next path
    }
  }

  throw new Error('No Firebase access token. Run: npx firebase-tools login');
}

async function fetchGoogleOAuthClientId(token) {
  if (process.env.FIREBASE_GOOGLE_OAUTH_CLIENT_ID?.trim()) {
    return process.env.FIREBASE_GOOGLE_OAUTH_CLIENT_ID.trim();
  }

  const projectNumber = '516504852870';
  const res = await fetch(
    `https://content.googleapis.com/v1/projects/${projectNumber}/oauthClients`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.ok) {
    const payload = await res.json();
    const webClient = payload.oauthClients?.find((client) =>
      (client.displayName ?? '').toLowerCase().includes('web') ||
      (client.name ?? '').includes('web')
    );
    if (webClient?.clientId) return webClient.clientId;
  }

  // Firebase auto-creates this pattern for web apps
  return `${projectNumber}-${WEB_APP_ID.split(':').pop()}.apps.googleusercontent.com`;
}

async function getIdpConfig(token, idpId) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${encodeURIComponent(idpId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getIdp ${idpId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function upsertIdpConfig(token, idpId, body) {
  const existing = await getIdpConfig(token, idpId);
  const name = `projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${idpId}`;

  if (existing) {
    const res = await fetch(`${API_BASE}/${name}?updateMask=enabled,clientId,clientSecret,appleSignInConfig`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, ...body, name }),
    });
    if (!res.ok) throw new Error(`patchIdp ${idpId}: ${res.status} ${await res.text()}`);
    return res.json();
  }

  const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=${encodeURIComponent(idpId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...body }),
  });
  if (!res.ok) throw new Error(`createIdp ${idpId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function enableGoogle(token) {
  const existing = await getIdpConfig(token, 'google.com');
  if (existing?.enabled) {
    console.log('[PASS] Google sign-in already enabled:', { clientId: existing.clientId });
    return existing;
  }

  const clientId = await fetchGoogleOAuthClientId(token);
  const clientSecret = process.env.FIREBASE_GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    console.warn('[SKIP] Google IdP create — run: npx firebase-tools deploy --only auth');
    return null;
  }

  const updated = await upsertIdpConfig(token, 'google.com', {
    enabled: true,
    clientId,
    clientSecret,
  });

  console.log('[PASS] Google sign-in enabled:', { enabled: updated.enabled, clientId: updated.clientId });
  return updated;
}

async function enableApple(token) {
  const teamId = process.env.FIREBASE_APPLE_TEAM_ID?.trim();
  const keyId = process.env.FIREBASE_APPLE_KEY_ID?.trim();
  const privateKey = process.env.FIREBASE_APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const serviceId = process.env.FIREBASE_APPLE_SERVICE_ID?.trim() ?? 'com.vishvakarma.os.web';

  if (!teamId || !keyId || !privateKey) {
    console.warn('[SKIP] Apple sign-in — set FIREBASE_APPLE_TEAM_ID, FIREBASE_APPLE_KEY_ID, FIREBASE_APPLE_PRIVATE_KEY');
    console.warn('       Enable manually: Firebase Console → Authentication → Apple');
    return null;
  }

  const updated = await upsertIdpConfig(token, 'apple.com', {
    enabled: true,
    clientId: serviceId,
    appleSignInConfig: {
      codeFlowConfig: { teamId, keyId, privateKey },
      bundleIds: [],
    },
  });

  console.log('[PASS] Apple sign-in enabled:', { enabled: updated.enabled, clientId: updated.clientId });
  return updated;
}

async function ensurePasswordlessEmail(token) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const current = await res.json();
  const patch = await fetch(
    `${API_BASE}/projects/${PROJECT_ID}/config?updateMask=signIn.email`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `projects/${PROJECT_ID}/config`,
        signIn: { email: { enabled: true, passwordRequired: false } },
      }),
    }
  );
  if (!patch.ok) throw new Error(`email config patch: ${patch.status} ${await patch.text()}`);
  const updated = await patch.json();
  console.log('[PASS] Email passwordless restored:', updated.signIn?.email ?? {});
  return updated;
}

async function main() {
  console.log(`[setup] OAuth providers for: ${PROJECT_ID}`);
  const token = getAccessToken();
  await enableGoogle(token);
  await enableApple(token);
  await ensurePasswordlessEmail(token);
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
