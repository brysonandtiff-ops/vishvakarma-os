#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { access, chmod, mkdir, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const valueArg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const hasFlag = (name) => argv.includes(name);

const baseOrigin = new URL(
  valueArg('--pages-url', process.env.CLOUDFLARE_PAGES_URL || 'https://vishvakarma-os.pages.dev'),
).origin;
const reset = hasFlag('--reset');
const nonInteractive = hasFlag('--non-interactive');
const authStatePath =
  process.env.CLOUDFLARE_AUTH_STATE_PATH ||
  join(process.cwd(), '.local', 'cloudflare-auth', 'storage-state.json');
const credentialVaultValue = valueArg(
  '--credential-vault',
  process.env.VISH_SUPABASE_CREDENTIAL_VAULT || '',
).trim();
const credentialVaultPath = credentialVaultValue ? resolve(credentialVaultValue) : null;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function ensureIgnored(path) {
  const relativePath = relative(process.cwd(), path).replaceAll('\\', '/');
  try {
    execFileSync('git', ['check-ignore', '--quiet', relativePath], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
  } catch {
    throw new Error(`${relativePath} must be excluded by .gitignore before auth data can be used.`);
  }
}

function readWindowsEncryptedCredential(path) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$credential = Import-Clixml -LiteralPath $args[0]',
    "if (-not ($credential -is [System.Management.Automation.PSCredential])) { throw 'Credential vault does not contain a PSCredential.' }",
    '$password = $credential.GetNetworkCredential().Password',
    "if ([string]::IsNullOrWhiteSpace($credential.UserName) -or [string]::IsNullOrEmpty($password)) { throw 'Credential vault is incomplete.' }",
    '[pscustomobject]@{ email = $credential.UserName; password = $password } | ConvertTo-Json -Compress',
  ].join('; ');

  let output;
  try {
    output = execFileSync(
      'pwsh',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script, path],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  } catch (error) {
    const detail = error?.stderr?.toString?.().trim();
    throw new Error(
      `Windows encrypted Supabase credential could not be opened${detail ? `: ${detail}` : '.'}`,
    );
  }

  let credential;
  try {
    credential = JSON.parse(output);
  } catch {
    throw new Error('Windows credential vault returned invalid data.');
  }

  if (
    typeof credential?.email !== 'string' ||
    !credential.email.includes('@') ||
    typeof credential?.password !== 'string' ||
    credential.password.length === 0
  ) {
    throw new Error('Windows credential vault does not contain a valid Supabase email/password pair.');
  }

  return credential;
}

async function inspectSupabaseSession(page) {
  return page.evaluate(() => {
    const now = Math.floor(Date.now() / 1000);

    function jwtExpiry(token) {
      try {
        const encoded = token.split('.')[1];
        if (!encoded) return null;
        const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const payload = JSON.parse(atob(padded));
        const expiry = Number(payload?.exp);
        return Number.isFinite(expiry) ? expiry : null;
      } catch {
        return null;
      }
    }

    function findSession(value, depth = 0) {
      if (!value || typeof value !== 'object' || depth > 6) return null;
      if (typeof value.access_token === 'string') {
        const explicitExpiry = Number(value.expires_at);
        const expiresAt = Number.isFinite(explicitExpiry)
          ? explicitExpiry
          : jwtExpiry(value.access_token);
        return {
          expiresAt,
          valid: expiresAt === null || expiresAt > now + 30,
        };
      }
      for (const nested of Object.values(value)) {
        const session = findSession(nested, depth + 1);
        if (session) return session;
      }
      return null;
    }

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const session = findSession(JSON.parse(raw));
        if (session) return { ...session, key };
      } catch {
        // Ignore malformed storage and continue.
      }
    }
    return { expiresAt: null, key: null, valid: false };
  });
}

async function stableAuthenticatedEditor(page, settleMs = 2500) {
  if (!page.url().startsWith(baseOrigin) || !page.url().includes('/editor')) {
    return { valid: false, detail: `not on editor: ${page.url()}` };
  }
  await page.waitForTimeout(settleMs);
  if (!page.url().startsWith(baseOrigin) || !page.url().includes('/editor')) {
    return { valid: false, detail: `redirected to ${page.url()}` };
  }
  const session = await inspectSupabaseSession(page).catch(() => ({ valid: false }));
  return {
    valid: session.valid === true,
    detail: session.valid
      ? `stable Supabase password session${session.expiresAt ? `; expires ${new Date(session.expiresAt * 1000).toISOString()}` : ''}`
      : 'editor URL has no valid Supabase access token',
  };
}

async function verifySavedState() {
  if (!(await exists(authStatePath))) return { valid: false, detail: 'saved state is missing' };
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    await page.goto(`${baseOrigin}/editor`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    return await stableAuthenticatedEditor(page);
  } finally {
    await browser.close().catch(() => null);
  }
}

async function bootstrap() {
  let credential = credentialVaultPath
    ? readWindowsEncryptedCredential(credentialVaultPath)
    : null;

  console.log('[auth-bootstrap] Opening Chromium for the approved Supabase email/password sign-in.');
  if (credential) {
    console.log('[auth-bootstrap] ISC automatic login is enabled with a Windows-encrypted local credential.');
  } else {
    console.log('[auth-bootstrap] Enter the approved account in the visible Vishvakarma.OS form.');
  }
  console.log('[auth-bootstrap] The session will not be saved until /editor remains stable and a real Supabase access token exists.');

  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseOrigin}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    const emailInput = page.getByTestId('supabase-email-input');
    const passwordInput = page.getByTestId('supabase-password-input');
    const submitButton = page.getByTestId('supabase-password-button');
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });

    if (credential) {
      await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
      await submitButton.waitFor({ state: 'visible', timeout: 30_000 });
      await emailInput.fill(credential.email);
      await passwordInput.fill(credential.password);
      credential.password = '';
      credential = null;
      await submitButton.click();
      console.log('[auth-bootstrap] ISC submitted the Windows-encrypted Supabase credential automatically.');
    } else {
      await emailInput.focus();
    }

    const deadline = Date.now() + 300_000;
    let authenticated = null;
    while (Date.now() < deadline && !authenticated) {
      for (const candidate of context.pages()) {
        const state = await stableAuthenticatedEditor(candidate, 1200).catch(() => ({ valid: false }));
        if (state.valid) {
          authenticated = { page: candidate, state };
          break;
        }
      }
      if (!authenticated) await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!authenticated) {
      throw new Error('Supabase email/password sign-in did not produce a stable authenticated /editor session within five minutes.');
    }

    await mkdir(dirname(authStatePath), { recursive: true });
    await context.storageState({ path: authStatePath });
    await chmod(authStatePath, 0o600).catch(() => null);
    console.log(`PASS: Fresh Supabase email/password session saved - ${authenticated.state.detail}`);
  } finally {
    await browser.close().catch(() => null);
  }
}

ensureIgnored(authStatePath);
if (credentialVaultPath) {
  ensureIgnored(credentialVaultPath);
  if (!(await exists(credentialVaultPath))) {
    throw new Error('Configured Windows-encrypted Supabase credential vault is missing.');
  }
}

if (reset) {
  await rm(authStatePath, { force: true });
  console.log('[auth-bootstrap] Removed previous browser session state.');
}

let state = await verifySavedState();
if (!state.valid) {
  console.log(`[auth-bootstrap] ${state.detail}`);
  if (nonInteractive && !credentialVaultPath) {
    throw new Error('No valid saved Supabase session or encrypted automatic-login credential is available in non-interactive mode.');
  }
  await rm(authStatePath, { force: true });
  await bootstrap();
  state = await verifySavedState();
}

if (!state.valid) {
  throw new Error(`Saved Supabase auth session failed independent verification: ${state.detail}`);
}

console.log(`AUTH SESSION BOOTSTRAP: PASS - ${state.detail}`);
