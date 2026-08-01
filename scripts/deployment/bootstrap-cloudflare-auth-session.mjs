#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { access, chmod, mkdir, rm } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
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
    throw new Error(`${relativePath} must be excluded by .gitignore before auth state can be saved.`);
  }
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
      ? `stable authenticated editor${session.expiresAt ? `; expires ${new Date(session.expiresAt * 1000).toISOString()}` : ''}`
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
  console.log('[auth-bootstrap] Opening Chromium for Google/Supabase sign-in.');
  console.log('[auth-bootstrap] The session will not be saved until /editor remains stable and a real Supabase access token exists.');

  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseOrigin}/editor`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page.waitForTimeout(1500);

    if (page.url().includes('/auth')) {
      const googleButton = page.getByRole('button', { name: /continue with google/i });
      await googleButton.waitFor({ state: 'visible', timeout: 30_000 });
      await googleButton.click({ noWaitAfter: true });
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
      throw new Error('Google sign-in did not produce a stable authenticated /editor session within five minutes.');
    }

    await mkdir(dirname(authStatePath), { recursive: true });
    await context.storageState({ path: authStatePath });
    await chmod(authStatePath, 0o600).catch(() => null);
    console.log(`PASS: Fresh Google/Supabase session saved - ${authenticated.state.detail}`);
  } finally {
    await browser.close().catch(() => null);
  }
}

ensureIgnored(authStatePath);
if (reset) {
  await rm(authStatePath, { force: true });
  console.log('[auth-bootstrap] Removed previous browser session state.');
}

let state = await verifySavedState();
if (!state.valid) {
  console.log(`[auth-bootstrap] ${state.detail}`);
  if (nonInteractive) {
    throw new Error('No valid saved Google/Supabase session is available in non-interactive mode.');
  }
  await rm(authStatePath, { force: true });
  await bootstrap();
  state = await verifySavedState();
}

if (!state.valid) {
  throw new Error(`Saved auth session failed independent verification: ${state.detail}`);
}

console.log(`AUTH SESSION BOOTSTRAP: PASS - ${state.detail}`);
