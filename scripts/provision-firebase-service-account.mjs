#!/usr/bin/env node
/**
 * Creates (or reuses) a Firebase Admin service account key for Vercel webhooks.
 * Uses firebase-tools cached OAuth token — run after `firebase login`.
 *
 * Usage: node scripts/provision-firebase-service-account.mjs [--write-env .env.stripe.local]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim() || 'gen-lang-client-0690161780';
const writeEnvPath = process.argv.includes('--write-env')
  ? process.argv[process.argv.indexOf('--write-env') + 1]
  : null;

function loadFirebaseToolsConfig() {
  const path = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(path)) {
    throw new Error('firebase-tools.json not found. Run: npx firebase-tools login');
  }
  const config = JSON.parse(readFileSync(path, 'utf8'));
  const accessToken = config.tokens?.access_token?.trim();
  if (!accessToken) {
    throw new Error('No firebase-tools access token. Run: npx firebase-tools login');
  }
  return accessToken;
}

async function googleFetch(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    throw new Error(payload.error?.message ?? payload.error ?? text ?? `HTTP ${response.status}`);
  }
  return payload;
}

async function findFirebaseAdminServiceAccount(accessToken) {
  const url = `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`;
  const payload = await googleFetch(accessToken, url);
  const accounts = payload.accounts ?? [];
  const adminSdk = accounts.find((account) => account.email?.includes('firebase-adminsdk'));
  if (!adminSdk?.email) {
    throw new Error(`No firebase-adminsdk service account found in project ${PROJECT_ID}`);
  }
  return adminSdk.email;
}

async function createServiceAccountKey(accessToken, serviceAccountEmail) {
  const encoded = encodeURIComponent(serviceAccountEmail);
  const url = `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encoded}/keys`;
  return googleFetch(accessToken, url, {
    method: 'POST',
    body: JSON.stringify({
      keyAlgorithm: 'KEY_ALG_RSA_2048',
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
    }),
  });
}

async function main() {
  const accessToken = loadFirebaseToolsConfig();
  const serviceAccountEmail = await findFirebaseAdminServiceAccount(accessToken);
  console.log(`[OK] Using service account: ${serviceAccountEmail}`);

  const keyPayload = await createServiceAccountKey(accessToken, serviceAccountEmail);
  const privateKeyData = keyPayload.privateKeyData;
  if (!privateKeyData) {
    throw new Error('IAM API did not return privateKeyData');
  }

  const json = Buffer.from(privateKeyData, 'base64').toString('utf8');
  JSON.parse(json);

  console.log('[OK] Service account key created');
  console.log(`FIREBASE_PROJECT_ID=${PROJECT_ID}`);
  console.log('FIREBASE_SERVICE_ACCOUNT_JSON written to output file only (not printed).');

  if (writeEnvPath) {
    const lines = [
      `FIREBASE_PROJECT_ID=${PROJECT_ID}`,
      `FIREBASE_SERVICE_ACCOUNT_JSON=${JSON.stringify(JSON.parse(json))}`,
      `APP_URL=https://vishvakarma-os.vercel.app`,
      'VITE_BACKEND_PROVIDER=firebase',
      'BACKEND_PROVIDER=firebase',
      'VITE_STRIPE_BILLING_ENABLED=true',
      'VITE_PRICING_PAGE_ENABLED=true',
    ];
    writeFileSync(writeEnvPath, `${lines.join('\n')}\n`, 'utf8');
    console.log(`[OK] Wrote ${writeEnvPath} (add STRIPE_* vars before pushing to Vercel)`);
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
