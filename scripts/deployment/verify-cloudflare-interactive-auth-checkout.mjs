#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PRODUCTION_URL ||
    'https://vishvakarma-os.pages.dev',
);
const baseOrigin = baseUrl.origin;
const evidenceDir = join(process.cwd(), 'evidence', 'cloudflare-cutover');
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const evidencePath = join(
  evidenceDir,
  `interactive-auth-checkout-${timestamp}.json`,
);
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail, recordedAt: new Date().toISOString() });
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

async function findPage(context, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const candidate of context.pages()) {
      if (predicate(candidate.url())) return candidate;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return null;
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

await mkdir(evidenceDir, { recursive: true });

console.log('[interactive-proof] Target:', baseOrigin);
console.log('[interactive-proof] A Chromium window will open.');
console.log('[interactive-proof] Complete Google sign-in when prompted.');
console.log('[interactive-proof] Do not enter payment card details; the test stops after Stripe Checkout opens.\n');

let browser;
try {
  browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  let page = await context.newPage();

  await page.goto(`${baseOrigin}/editor`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });

  if (page.url().includes('/auth')) {
    const googleButton = page.getByRole('button', {
      name: /continue with google/i,
    });
    await googleButton.waitFor({ state: 'visible', timeout: 30_000 });
    await googleButton.click({ noWaitAfter: true });
  }

  console.log('[interactive-proof] Waiting up to five minutes for Google sign-in to return to /editor...');
  const editorPage = await findPage(
    context,
    (url) => url.startsWith(baseOrigin) && url.includes('/editor'),
    300_000,
  );

  if (!editorPage) {
    record(
      'Supabase Google callback returns to editor',
      false,
      'Timed out waiting for an authenticated /editor page.',
    );
    throw new Error('Google sign-in did not return to /editor within five minutes.');
  }

  page = editorPage;
  record('Supabase Google callback returns to editor', true, page.url());

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2500);
  const sessionPersisted = page.url().startsWith(baseOrigin) && page.url().includes('/editor');
  record(
    'Supabase session persists after refresh',
    sessionPersisted,
    page.url(),
  );
  if (!sessionPersisted) {
    throw new Error('Authenticated session did not persist after refresh.');
  }

  await page.goto(`${baseOrigin}/pricing`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.waitForTimeout(1500);

  const checkoutCta = await findVisibleCheckoutCta(page);
  if (!checkoutCta) {
    record(
      'Studio checkout action is visible',
      false,
      'Could not find the Start 14-day free trial action.',
    );
    throw new Error('Studio checkout action is not visible.');
  }
  record('Studio checkout action is visible', true, 'Start 14-day free trial');

  await checkoutCta.click({ noWaitAfter: true });
  console.log('[interactive-proof] Waiting for Stripe Checkout to open...');

  const stripePage = await findPage(
    context,
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
      `No Stripe-hosted checkout page opened. Current application URL: ${page.url()}`,
    );
    throw new Error('Stripe Checkout did not open within two minutes.');
  }

  record('Stripe Checkout opens from the Studio plan', true, stripePage.url());
  console.log('\n[interactive-proof] Stripe Checkout is visible. Do not enter card details.');
  console.log('[interactive-proof] The browser will close automatically in 10 seconds.\n');
  await stripePage.waitForTimeout(10_000);
} catch (error) {
  if (!results.some((result) => result.pass === false)) {
    record(
      'Interactive Cloudflare auth and checkout proof',
      false,
      error instanceof Error ? error.message : String(error),
    );
  }
} finally {
  await browser?.close().catch(() => null);
}

const failed = results.filter((result) => !result.pass);
const evidence = {
  generatedAt: new Date().toISOString(),
  target: baseOrigin,
  gitHead: currentGitHead(),
  result: failed.length === 0 ? 'PASS' : 'FAIL',
  results,
};
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

console.log('\n--- Interactive proof summary ---');
for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name} | ${result.detail}`);
}
console.log('Evidence:', evidencePath);

if (failed.length > 0) {
  console.error(`\nINTERACTIVE CLOUDFLARE PROOF: FAILED (${failed.length})`);
  process.exitCode = 1;
} else {
  console.log(`\nINTERACTIVE CLOUDFLARE PROOF: PASS (${results.length})`);
}
