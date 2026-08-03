#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { access, chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
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
  await page.waitForTimeout(2500);
  return page.url().startsWith(baseOrigin) && page.url().includes('/editor');
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
  console.log('\n[auth-bootstrap] A Chromium window is opening for the approved Supabase email/password sign-in.');
  console.log('[auth-bootstrap] Enter the approved account in the Vishvakarma.OS form. The script will continue automatically.\n');

  const session = await startBrowser({ headless: false });
  let editorPage = session.page;

  try {
    await editorPage.goto(`${baseOrigin}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    const emailInput = editorPage.getByTestId('supabase-email-input');
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    await emailInput.focus();

    editorPage = await findPage(
      session.context,
      (url) => url.startsWith(baseOrigin) && url.includes('/editor'),
      300_000,
    );

    if (!editorPage) {
      throw new Error('Supabase email/password sign-in did not return to /editor within five minutes.');
    }

    record('Supabase email/password sign-in returns to editor', true, editorPage.url());
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
    await session.page.waitForTimeout(2500);
    const persisted =
      session.page.url().startsWith(baseOrigin) &&
      session.page.url().includes('/editor');
    record('Supabase password session persists after refresh', persisted, session.page.url());
    if (!persisted) {
      throw new Error('Authenticated Supabase password session did not persist after refresh.');
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
      if (nonInteractive) {
        throw new Error(
          'No valid saved Supabase password session is available. Run once without --non-interactive to complete email/password sign-in.',
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
