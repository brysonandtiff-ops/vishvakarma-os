#!/usr/bin/env node
/**
 * Smoke-test Firebase auth configuration (email link + OAuth provider status).
 * Run: node scripts/test-firebase-auth-smoke.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ID = 'gen-lang-client-0690161780';
const API_BASE = 'https://identitytoolkit.googleapis.com/admin/v2';

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
  } catch {
    return {};
  }
}

function getAccessToken() {
  const configPaths = [
    join(process.env.APPDATA ?? '', 'configstore', 'firebase-tools.json'),
    join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.config', 'configstore', 'firebase-tools.json'),
  ];

  for (const path of configPaths) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      if (parsed?.tokens?.access_token) return parsed.tokens.access_token;
    } catch {
      // try next
    }
  }

  return null;
}

async function testEmailLink(apiKey) {
  const continueUrl = 'https://vishvakarma-os.vercel.app/auth';
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'EMAIL_SIGNIN',
      email: 'auth-smoke-test@example.com',
      continueUrl,
      canHandleCodeInApp: true,
    }),
  });
  const body = await res.json();
  const ok = res.ok && !body.error;
  console.log(ok ? '[PASS]' : '[FAIL]', `Email link API (${continueUrl})`, body.error?.message ?? `HTTP ${res.status}`);
  return ok;
}

async function testIdp(token, idpId) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${encodeURIComponent(idpId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) {
    console.log('[FAIL]', `${idpId} not configured`);
    return false;
  }
  const body = await res.json();
  const ok = body.enabled === true;
  console.log(ok ? '[PASS]' : '[FAIL]', `${idpId} enabled=${body.enabled}`, body.clientId ? `clientId=${body.clientId}` : '');
  return ok;
}

async function testEmailConfig(token) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_ID}/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const email = body.signIn?.email ?? {};
  const ok = email.enabled === true && email.passwordRequired !== true;
  console.log(ok ? '[PASS]' : '[FAIL]', 'Email passwordless config', JSON.stringify(email));
  return ok;
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.VITE_FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY;
  const token = getAccessToken();

  let passed = 0;
  let total = 0;

  if (apiKey) {
    total += 1;
    if (await testEmailLink(apiKey)) passed += 1;
  } else {
    console.log('[FAIL] Missing VITE_FIREBASE_API_KEY for email smoke test');
    total += 1;
  }

  if (token) {
    total += 1;
    if (await testEmailConfig(token)) passed += 1;
    total += 1;
    if (await testIdp(token, 'google.com')) passed += 1;
    const appleRequired = Boolean(
      process.env.FIREBASE_APPLE_TEAM_ID &&
        process.env.FIREBASE_APPLE_KEY_ID &&
        process.env.FIREBASE_APPLE_PRIVATE_KEY
    );
    if (appleRequired) {
      total += 1;
      if (await testIdp(token, 'apple.com')) passed += 1;
    } else {
      const appleOk = await testIdp(token, 'apple.com');
      if (!appleOk) {
        console.log('[SKIP] Apple sign-in — set FIREBASE_APPLE_TEAM_ID, FIREBASE_APPLE_KEY_ID, FIREBASE_APPLE_PRIVATE_KEY then pnpm run setup:firebase-oauth');
      }
    }
  } else {
    console.warn('[WARN] No Firebase CLI token — skipping OAuth provider checks');
  }

  console.log(`\nResult: ${passed}/${total} checks passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
