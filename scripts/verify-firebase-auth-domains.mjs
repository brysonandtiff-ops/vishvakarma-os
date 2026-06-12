#!/usr/bin/env node
/**
 * Verify Firebase authorized domains include production host and active Vercel aliases.
 * Run: node scripts/verify-firebase-auth-domains.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ID = 'gen-lang-client-0690161780';
const REQUIRED_DOMAINS = [
  'vishvakarma-os.vercel.app',
  'vishvakarma-os-tyrasic-creations.vercel.app',
  'vishvakarma-os-git-main-tyrasic-creations.vercel.app',
  'localhost',
  '127.0.0.1',
  'gen-lang-client-0690161780.firebaseapp.com',
];

function getAccessToken() {
  const configPaths = [
    join(process.env.APPDATA ?? '', 'configstore', 'firebase-tools.json'),
    join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.config', 'configstore', 'firebase-tools.json'),
  ];

  for (const path of configPaths) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      const token = parsed?.tokens?.access_token;
      if (token) return token;
    } catch {
      // try next
    }
  }

  return null;
}

async function main() {
  const token = getAccessToken();
  if (!token) {
    console.warn('[SKIP] No Firebase CLI token — run: npx firebase-tools login');
    process.exit(0);
  }

  const res = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error('[FAIL] getConfig', res.status, await res.text());
    process.exit(1);
  }

  const config = await res.json();
  const authorized = new Set(config.authorizedDomains ?? []);
  const missing = REQUIRED_DOMAINS.filter((domain) => !authorized.has(domain));

  console.log('[INFO] Authorized domains:', [...authorized]);

  if (missing.length > 0) {
    console.error('[FAIL] Missing required domains:', missing.join(', '));
    console.error('       Run: pnpm run setup:firebase-auth');
    process.exit(1);
  }

  console.log('[PASS] All required Firebase authorized domains present');
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
