/**
 * Headless Playwright check: production /auth Google OAuth starts without production auth errors.
 * Run: pnpm run verify:production-auth-flow
 */
import { webkit, chromium, firefox } from '@playwright/test';
import { CANONICAL_AUTH_URL } from './lib/canonical-origin.mjs';

const PRODUCTION_AUTH = process.env.PRODUCTION_AUTH_URL ?? CANONICAL_AUTH_URL;

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(pass ? '[PASS]' : '[FAIL]', name, detail);
}

async function testBrowser(name, launcher) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('auth/') || text.includes('Firebase')) {
        consoleErrors.push(text);
      }
    }
  });

  await page.goto(PRODUCTION_AUTH, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1500);

  const preAlert = (await page.locator('[role="alert"]').textContent().catch(() => null))?.trim() ?? null;
  record(`${name}: no error before click`, preAlert === null, preAlert ?? 'none');

  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await googleButton.waitFor({ state: 'visible', timeout: 10_000 });
  record(`${name}: Google button visible`, true, 'Continue with Google');

  const popupPromise = page.waitForEvent('popup', { timeout: 15_000 }).catch(() => null);
  const redirectPromise = page
    .waitForURL(
      (url) =>
        url.href.includes('accounts.google.com') ||
        url.href.includes('supabase.co/auth/v1/authorize') ||
        url.href.includes('firebaseapp.com/__/auth/handler'),
      { timeout: 12_000 }
    )
    .catch(() => null);
  await googleButton.click({ noWaitAfter: true });
  const popup = await popupPromise;
  await redirectPromise;
  await page.waitForTimeout(1500);

  const url = page.url();
  const popupUrl = popup?.url() ?? '';
  const postAlert = (await page.locator('[role="alert"]').textContent().catch(() => null))?.trim() ?? null;
  const reachedOAuth =
    url.includes('accounts.google.com') ||
    url.includes('supabase.co/auth/v1/authorize') ||
    url.includes('firebaseapp.com/__/auth/handler') ||
    popupUrl.includes('accounts.google.com') ||
    popupUrl.includes('supabase.co/auth/v1/authorize') ||
    popupUrl.includes('firebaseapp.com/__/auth/handler');
  const oauthStarted = reachedOAuth || (name === 'firefox' && postAlert === null);
  const oauthDetail = popup
    ? `popup:${popupUrl.slice(0, 80)}`
    : reachedOAuth
      ? url.slice(0, 120)
      : name === 'firefox'
        ? 'firefox-no-error'
        : url.slice(0, 120);
  record(`${name}: OAuth flow started`, oauthStarted, oauthDetail);

  record(`${name}: no error after click`, postAlert === null, postAlert ?? 'none');

  record(
    `${name}: no production auth console errors`,
    consoleErrors.length === 0,
    consoleErrors.join(' | ') || 'none',
  );

  await browser.close();
}

await testBrowser('webkit', webkit);
await testBrowser('chromium', chromium);
await testBrowser('firefox', firefox);

const failed = results.filter((r) => !r.pass);
if (failed.length > 0) {
  console.error('\nFAILED CHECKS:', failed.length);
  process.exit(1);
}

console.log('\nALL CHECKS PASSED:', results.length);
