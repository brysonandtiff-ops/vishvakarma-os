#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { access, chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const args = new Set(process.argv.slice(2));
const forceHeaded = args.has('--headed');
const resetSession = args.has('--reset-session');
const bootstrapOnly = args.has('--bootstrap-only');
const nonInteractive = args.has('--non-interactive');
const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PRODUCTION_URL ||
    'https://vishvakarma-os.pages.dev',
);
const baseOrigin = baseUrl.origin;
const evidenceDir = join(process.cwd(), 'evidence', 'cloudflare-cutover');
const authStatePath =
  process.env.CLOUDFLARE_AUTH_STATE_PATH ||
  join(process.cwd(), '.local', 'cloudflare-auth', 'storage-state.json');
const credentialVaultValue = (process.env.VISH_SUPABASE_CREDENTIAL_VAULT || '').trim();
const credentialVaultPath = credentialVaultValue ? resolve(credentialVaultValue) : null;
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const evidencePath = join(evidenceDir, `auth-checkout-${timestamp}.json`);
const summaryPath = join(evidenceDir, `auth-checkout-${timestamp}.md`);
const results = [];

function record(name, pass, detail) {
  const entry = { name, pass, detail, recordedAt: new Date().toISOString() };
  results.push(entry);
  console.log(pass ? '[PASS]' : '[FAIL]', name, '-', detail);
}

function currentGitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function relativeStatePath() {
  return relative(process.cwd(), authStatePath).replaceAll('\\', '/');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isIgnoredByGit(path) {
  try {
    execFileSync('git', ['check-ignore', '--quiet', path], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function ensureIgnoredAbsolute(path) {
  const relativePath = relative(process.cwd(), path).replaceAll('\\', '/');
  if (!isIgnoredByGit(relativePath)) {
    throw new Error(`${relativePath} must be excluded by .gitignore before encrypted auth data can be used.`);
  }
}

function readWindowsEncryptedCredential(path) {
  const resolvedVaultPath = resolve(path);
  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$vaultPath = $env:VISH_SUPABASE_CREDENTIAL_VAULT_PATH',
    "if ([string]::IsNullOrWhiteSpace($vaultPath)) { throw 'Credential vault path was not provided.' }",
    "if (-not (Test-Path -LiteralPath $vaultPath -PathType Leaf)) { throw 'Credential vault file does not exist.' }",
    '$credential = Import-Clixml -LiteralPath $vaultPath',
    "if (-not ($credential -is [System.Management.Automation.PSCredential])) { throw 'Credential vault does not contain a PSCredential.' }",
    '$password = $credential.GetNetworkCredential().Password',
    "if ([string]::IsNullOrWhiteSpace($credential.UserName) -or [string]::IsNullOrEmpty($password)) { throw 'Credential vault is incomplete.' }",
    '[pscustomobject]@{ email = $credential.UserName; password = $password } | ConvertTo-Json -Compress',
  ].join('; ');

  let output;
  try {
    output = execFileSync(
      'pwsh',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          VISH_SUPABASE_CREDENTIAL_VAULT_PATH: resolvedVaultPath,
        },
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

async function stableAuthenticatedEditor(page, settleMs = 1800) {
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
      ? `stable Supabase session${session.expiresAt ? `; expires ${new Date(session.expiresAt * 1000).toISOString()}` : ''}`
      : 'editor URL has no valid Supabase access token',
  };
}

async function visibleAuthError(page) {
  if (!page.url().startsWith(baseOrigin) || !page.url().includes('/auth')) return null;
  const locator = page.locator('.vish-login-page__status--error').first();
  if ((await locator.count()) === 0 || !(await locator.isVisible().catch(() => false))) {
    return null;
  }
  const text = (await locator.textContent().catch(() => ''))?.trim();
  return text || null;
}

async function findPage(context, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const candidate of context.pages()) {
      if (predicate(candidate.url())) return candidate;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}

async function isAuthenticatedEditor(page) {
  await page.goto(`${baseOrigin}/editor`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  const state = await stableAuthenticatedEditor(page, 2500);
  return state.valid;
}

async function findVisibleCheckoutCta(page) {
  const candidates = [
    page.getByRole('button', { name: /start 14-day free trial/i }),
    page.getByRole('link', { name: /start 14-day free trial/i }),
    page.getByText(/start 14-day free trial/i),
  ];

  for (const locator of candidates) {
    const first = locator.first();
    if ((await first.count()) > 0 && (await first.isVisible().catch(() => false))) {
      return first;
    }
  }
  return null;
}

async function startBrowser({ headless, storageState }) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext(storageState ? { storageState } : {});
  const page = await context.newPage();
  return { browser, context, page };
}

async function bootstrapAuthSession() {
  let credential = credentialVaultPath
    ? readWindowsEncryptedCredential(credentialVaultPath)
    : null;

  console.log('\n[auth-bootstrap] Opening Chromium for Supabase email/password sign-in.');
  console.log(
    credential
      ? '[auth-bootstrap] Post-deployment proof will submit the Windows-encrypted credential automatically.\n'
      : '[auth-bootstrap] Enter the account in the visible Vishvakarma.OS form.\n',
  );

  const session = await startBrowser({ headless: false });
  const page = session.page;

  try {
    await page.goto(`${baseOrigin}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    const emailInput = page.getByTestId('supabase-email-input');
    const passwordInput = page.getByTestId('supabase-password-input');
    const submitButton = page.getByTestId('supabase-password-button');
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });

    const automatic = Boolean(credential);
    if (credential) {
      await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
      await submitButton.waitFor({ state: 'visible', timeout: 30_000 });
      await emailInput.fill(credential.email);
      await passwordInput.fill(credential.password);
      credential.password = '';
      credential = null;
      await submitButton.click();
      console.log('[auth-bootstrap] Encrypted credential submitted automatically.');
    } else {
      await emailInput.focus();
    }

    const deadline = Date.now() + 300_000;
    let authenticated = null;
    while (Date.now() < deadline && !authenticated) {
      for (const candidate of session.context.pages()) {
        const state = await stableAuthenticatedEditor(candidate, 1200).catch(() => ({ valid: false }));
        if (state.valid) {
          authenticated = { page: candidate, state };
          break;
        }

        if (automatic) {
          const authError = await visibleAuthError(candidate).catch(() => null);
          if (authError) {
            throw new Error(`Supabase rejected the encrypted login: ${authError}`);
          }
        }
      }
      if (!authenticated) await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!authenticated) {
      throw new Error(
        automatic
          ? 'Encrypted Supabase login did not produce a stable authenticated /editor session within five minutes.'
          : 'Supabase email/password sign-in did not return to /editor within five minutes.',
      );
    }

    record('Supabase email/password sign-in returns to editor', true, authenticated.page.url());
    record('Authenticated editor contains a valid Supabase access token', true, authenticated.state.detail);
    await mkdir(dirname(authStatePath), { recursive: true });
    await session.context.storageState({ path: authStatePath });
    await chmod(authStatePath, 0o600).catch(() => null);
    record('Reusable authenticated browser state saved', true, relativeStatePath());
  } finally {
    await session.browser.close().catch(() => null);
  }
}

async function verifyReusableSessionAndCheckout() {
  const session = await startBrowser({
    headless: !forceHeaded,
    storageState: authStatePath,
  });

  try {
    const authenticated = await isAuthenticatedEditor(session.page);
    record(
      'Saved Supabase password session opens the editor',
      authenticated,
      session.page.url(),
    );
    if (!authenticated) {
      throw new Error('Saved Supabase password session is expired or no longer accepted.');
    }

    await session.page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    const persistedState = await stableAuthenticatedEditor(session.page, 2500);
    record(
      'Supabase password session persists after refresh',
      persistedState.valid,
      persistedState.detail,
    );
    if (!persistedState.valid) {
      throw new Error(`Authenticated Supabase password session did not persist after refresh: ${persistedState.detail}`);
    }

    if (bootstrapOnly) return;

    await session.page.goto(`${baseOrigin}/pricing`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await session.page.waitForTimeout(1500);

    const checkoutCta = await findVisibleCheckoutCta(session.page);
    const ctaVisible = Boolean(checkoutCta);
    record(
      'Studio checkout action is visible',
      ctaVisible,
      ctaVisible ? 'Start 14-day free trial' : 'missing',
    );
    if (!checkoutCta) {
      throw new Error('Studio checkout action is not visible.');
    }

    await checkoutCta.click({ noWaitAfter: true });
    const stripePage = await findPage(
      session.context,
      (url) => {
        try {
          const hostname = new URL(url).hostname;
          return (
            hostname === 'checkout.stripe.com' ||
            hostname.endsWith('.checkout.stripe.com') ||
            hostname === 'payments.stripe.com' ||
            hostname.endsWith('.payments.stripe.com')
          );
        } catch {
          return false;
        }
      },
      120_000,
    );

    if (!stripePage) {
      record(
        'Stripe Checkout opens from the Studio plan',
        false,
        `No Stripe-hosted page opened; application URL is ${session.page.url()}`,
      );
      throw new Error('Stripe Checkout did not open within two minutes.');
    }

    await stripePage.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => null);
    const stripeHost = new URL(stripePage.url()).hostname;
    record('Stripe Checkout opens from the Studio plan', true, stripeHost);
    await stripePage.close().catch(() => null);
  } finally {
    await session.browser.close().catch(() => null);
  }
}

await mkdir(evidenceDir, { recursive: true });
await mkdir(dirname(authStatePath), { recursive: true });

const stateRelativePath = relativeStatePath();
const stateIgnored = isIgnoredByGit(stateRelativePath);
if (!stateIgnored) {
  record(
    'Authenticated browser state is excluded from Git',
    false,
    `${stateRelativePath} is not ignored by .gitignore`,
  );
} else {
  record('Authenticated browser state is excluded from Git', true, stateRelativePath);
}

if (credentialVaultPath) {
  ensureIgnoredAbsolute(credentialVaultPath);
  if (!(await exists(credentialVaultPath))) {
    record('Windows-encrypted Supabase credential vault is available', false, 'configured vault is missing');
  } else {
    record(
      'Windows-encrypted Supabase credential vault is available',
      true,
      relative(process.cwd(), credentialVaultPath).replaceAll('\\', '/'),
    );
  }
}

if (resetSession) {
  await rm(authStatePath, { force: true });
  console.log('[auth-session] Removed the saved authenticated browser state.');
}

let needBootstrap = false;

if (stateIgnored) {
  const initialStateExists = await exists(authStatePath);
  needBootstrap = !initialStateExists;

  if (initialStateExists) {
    let probe;
    try {
      probe = await startBrowser({ headless: true, storageState: authStatePath });
      const valid = await isAuthenticatedEditor(probe.page);
      if (valid) {
        record('Existing authenticated Supabase password state is valid', true, probe.page.url());
      } else {
        console.warn('[auth-session] Saved Supabase password session is expired; automatic re-bootstrap is required.');
        needBootstrap = true;
      }
    } catch (error) {
      console.warn(
        '[auth-session] Saved Supabase password session could not be reused; automatic re-bootstrap is required:',
        error instanceof Error ? error.message : String(error),
      );
      needBootstrap = true;
    } finally {
      await probe?.browser.close().catch(() => null);
    }
  }

  try {
    if (needBootstrap) {
      if (nonInteractive && !credentialVaultPath) {
        throw new Error(
          'No valid saved Supabase password session is available. Supply the Windows-encrypted credential vault or run interactively.',
        );
      }
      await rm(authStatePath, { force: true });
      await bootstrapAuthSession();
      record('Authenticated Supabase password session bootstrap completed', true, relativeStatePath());
    }

    await verifyReusableSessionAndCheckout();
  } catch (error) {
    if (!results.some((result) => result.pass === false && result.name.includes('Stripe Checkout'))) {
      record(
        'Automated Cloudflare auth and checkout proof',
        false,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

const failed = results.filter((result) => !result.pass);
const evidence = {
  generatedAt: new Date().toISOString(),
  target: baseOrigin,
  gitHead: currentGitHead(),
  authStatePath: stateRelativePath,
  authMethod: 'supabase-email-password',
  credentialMode: credentialVaultPath ? 'windows-dpapi-vault' : 'interactive',
  mode: needBootstrap ? 'bootstrap-then-automated' : 'fully-automated-reuse',
  result: failed.length === 0 ? 'PASS' : 'FAIL',
  results,
};
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

const markdown = [
  '# Cloudflare Auth and Checkout Proof',
  '',
  `- Generated: ${evidence.generatedAt}`,
  `- Target: ${evidence.target}`,
  `- Git head: ${evidence.gitHead}`,
  `- Auth method: ${evidence.authMethod}`,
  `- Credential mode: ${evidence.credentialMode}`,
  `- Mode: ${evidence.mode}`,
  `- Result: **${evidence.result}**`,
  '',
  '| Check | Result | Detail |',
  '| --- | --- | --- |',
  ...results.map(
    (result) =>
      `| ${result.name.replaceAll('|', '\\|')} | ${result.pass ? 'PASS' : 'FAIL'} | ${String(result.detail).replaceAll('|', '\\|')} |`,
  ),
  '',
].join('\n');
await writeFile(summaryPath, markdown, 'utf8');

console.log('\n--- Automated auth and checkout summary ---');
for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name} | ${result.detail}`);
}
console.log('JSON evidence:', evidencePath);
console.log('Markdown evidence:', summaryPath);

if (failed.length > 0) {
  console.error(`\nAUTOMATED CLOUDFLARE AUTH/CHECKOUT PROOF: FAILED (${failed.length})`);
  process.exitCode = 1;
} else {
  console.log(`\nAUTOMATED CLOUDFLARE AUTH/CHECKOUT PROOF: PASS (${results.length})`);
}
