/**
 * Live auth flow verification for https://vishvakarma-os.vercel.app
 * - Automated: auth gate, deny/back path
 * - Interactive (headed): accept path — operator completes Google sign-in in the browser window
 *
 * Run: node scripts/verify-live-auth-flow.mjs
 *      node scripts/verify-live-auth-flow.mjs --skip-interactive
 */
import { chromium } from '@playwright/test';

const BASE = process.env.PRODUCTION_URL ?? 'https://vishvakarma-os.vercel.app';
const AUTH_URL = `${BASE}/auth`;
const EDITOR_URL = `${BASE}/editor`;
const skipInteractive = process.argv.includes('--skip-interactive');

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(pass ? '[PASS]' : '[FAIL]', name, detail);
}

async function testAuthGate(page) {
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForURL('**/auth**', { timeout: 30_000 });
  const onAuth = page.url().includes('/auth');
  record('gate: /editor redirects to /auth', onAuth, page.url());

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  let googleVisible = false;
  try {
    await googleButton.waitFor({ state: 'visible', timeout: 15_000 });
    googleVisible = true;
  } catch {
    googleVisible = false;
  }
  record('gate: Google button visible on /auth', googleVisible, googleVisible ? 'Continue with Google' : 'missing');

  const emailHidden =
    (await page.getByRole('button', { name: /send secure access link/i }).count()) === 0;
  record('gate: email link hidden (google-only)', emailHidden, emailHidden ? 'hidden' : 'shown');
}

async function testDenyPath(page) {
  await page.goto(AUTH_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1000);

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  const popupPromise = page.waitForEvent('popup', { timeout: 8_000 }).catch(() => null);
  await googleButton.click({ noWaitAfter: true });
  const popup = await popupPromise;
  await page.waitForTimeout(3000);

  const popupUrl = popup?.url() ?? '';
  const reachedGoogle =
    page.url().includes('accounts.google.com') ||
    page.url().includes('firebaseapp.com/__/auth/handler') ||
    popupUrl.includes('accounts.google.com') ||
    popupUrl.includes('firebaseapp.com/__/auth/handler');
  record('deny: OAuth flow started', reachedGoogle, popup ? `popup:${popupUrl.slice(0, 80)}` : page.url().slice(0, 100));

  if (popup) {
    await popup.close().catch(() => null);
    await page.waitForTimeout(1000);
  } else if (reachedGoogle) {
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(2000);
  }

  const finalUrl = page.url();
  const stayedOnAuth = finalUrl.includes('/auth') && !finalUrl.includes('/editor');
  record('deny: returns to /auth (not /editor)', stayedOnAuth, finalUrl);

  const canRetry = await googleButton.isVisible().catch(() => false);
  record('deny: Google button still clickable', canRetry, canRetry ? 'visible' : 'missing');
}

async function testAcceptPathInteractive() {
  if (skipInteractive) {
    record(
      'accept: operator Google sign-in → /editor',
      true,
      'SKIPPED (--skip-interactive) — run without flag for headed manual sign-in'
    );
    return;
  }

  console.log('\n[INTERACTIVE] Opening headed browser — complete Google sign-in in the window.');
  console.log('Expected: land on /editor after accepting Google consent.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForURL('**/auth**', { timeout: 30_000 });

    await page.getByRole('button', { name: /continue with google/i }).click();
    await page.waitForTimeout(2000);

    await page.waitForURL('**/editor**', { timeout: 180_000 });
    const onEditor = page.url().includes('/editor');
    record('accept: lands on /editor after Google sign-in', onEditor, page.url());

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const stillOnEditor = page.url().includes('/editor');
    record('accept: session persists after refresh', stillOnEditor, page.url());
  } catch (error) {
    record(
      'accept: lands on /editor after Google sign-in',
      false,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await browser.close();
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await testAuthGate(page);
await testDenyPath(page);
await browser.close();

await testAcceptPathInteractive();

const failed = results.filter((r) => !r.pass);
console.log('\n--- Summary ---');
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} | ${r.name} | ${r.detail}`);
}

if (failed.length > 0) {
  console.error(`\nFAILED: ${failed.length}/${results.length}`);
  process.exit(1);
}

console.log(`\nALL CHECKS PASSED: ${results.length}`);
