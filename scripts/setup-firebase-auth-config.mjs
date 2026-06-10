#!/usr/bin/env node
/**
 * Configure Firebase Auth: email link sign-in + authorized domains.
 * Requires: firebase login (MCP or CLI) with identitytoolkit scope.
 *
 * Run: node scripts/setup-firebase-auth-config.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const PROJECT_ID = 'gen-lang-client-0690161780';
const BASE_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'vishvakarma-os.vercel.app',
  'gen-lang-client-0690161780.firebaseapp.com',
];

function parseExtraDomains() {
  const extras = new Set();
  const addDomainIndex = process.argv.indexOf('--add-domain');
  if (addDomainIndex !== -1) {
    const value = process.argv[addDomainIndex + 1]?.trim();
    if (value) extras.add(value);
  }

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--add-domain=')) {
      const value = arg.slice('--add-domain='.length).trim();
      if (value) extras.add(value);
    }
  }

  if (process.env.VERCEL_URL?.trim()) {
    extras.add(process.env.VERCEL_URL.trim());
  }

  if (process.env.VERCEL_BRANCH_URL?.trim()) {
    extras.add(process.env.VERCEL_BRANCH_URL.trim());
  }

  if (process.env.FIREBASE_EXTRA_AUTHORIZED_DOMAINS?.trim()) {
    for (const domain of process.env.FIREBASE_EXTRA_AUTHORIZED_DOMAINS.split(',')) {
      const trimmed = domain.trim();
      if (trimmed) extras.add(trimmed);
    }
  }

  return [...extras];
}

function readFirebaseToolsToken() {
  const configPaths = [
    join(process.env.APPDATA ?? '', 'configstore', 'firebase-tools.json'),
    join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.config', 'configstore', 'firebase-tools.json'),
  ];

  for (const path of configPaths) {
    try {
      const raw = readFileSync(path, 'utf8');
      const parsed = JSON.parse(raw);
      const tokens = parsed?.tokens;
      if (!tokens?.access_token) continue;
      return {
        path,
        accessToken: tokens.access_token,
        expiresAt: tokens.expires_at ?? 0,
      };
    } catch {
      // try next path
    }
  }

  return null;
}

function refreshFirebaseToolsToken() {
  spawnSync(
    'npx',
    ['-y', 'firebase-tools@latest', 'projects:list', '--project', PROJECT_ID],
    { encoding: 'utf8', shell: true, stdio: 'ignore' },
  );
  return readFirebaseToolsToken();
}

function getAccessToken() {
  let token = readFirebaseToolsToken();
  if (token && Date.now() < token.expiresAt - 60_000) {
    return token.accessToken;
  }

  token = refreshFirebaseToolsToken();
  if (token && Date.now() < token.expiresAt - 60_000) {
    return token.accessToken;
  }

  const result = spawnSync('npx', ['-y', 'firebase-tools@latest', 'login:ci', '--no-localhost'], {
    encoding: 'utf8',
    shell: true,
  });
  if (result.status === 0 && result.stdout?.trim()) {
    return result.stdout.trim();
  }

  throw new Error('No Firebase access token. Run firebase login via MCP or CLI first.');
}

async function getConfig(token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`getConfig failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function updateConfig(token, current, extraDomains) {
  const existing = new Set(current.authorizedDomains ?? []);
  for (const domain of [...BASE_DOMAINS, ...extraDomains]) existing.add(domain);

  const body = {
    name: `projects/${PROJECT_ID}/config`,
    authorizedDomains: [...existing],
    signIn: {
      email: {
        enabled: true,
        passwordRequired: false,
      },
    },
  };

  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains,signIn.email`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`updateConfig failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log(`[setup] Firebase project: ${PROJECT_ID}`);
  const extraDomains = parseExtraDomains();
  if (extraDomains.length > 0) {
    console.log('[setup] Extra domains to authorize:', extraDomains);
  }
  const token = getAccessToken();
  const current = await getConfig(token);
  console.log('[setup] Current authorized domains:', current.authorizedDomains ?? []);
  console.log('[setup] Current email sign-in:', current.signIn?.email ?? {});

  const updated = await updateConfig(token, current, extraDomains);
  console.log('[PASS] Updated authorized domains:', updated.authorizedDomains ?? []);
  console.log('[PASS] Updated email sign-in:', updated.signIn?.email ?? {});

  const PRODUCTION_DOMAIN = 'vishvakarma-os.vercel.app';
  if (!(updated.authorizedDomains ?? []).includes(PRODUCTION_DOMAIN)) {
    throw new Error(`Production domain missing after update: ${PRODUCTION_DOMAIN}`);
  }
  console.log('[PASS] Production domain verified:', PRODUCTION_DOMAIN);
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
