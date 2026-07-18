/**
 * Headless Playwright check: production /auth must reach a usable Google sign-in
 * surface. Provider error pages (invalid/deleted clients, policy blocks, etc.)
 * are release failures even when Supabase successfully issued a redirect.
 *
 * Post-login redirect to /editor is covered by verify-live-auth-flow.mjs.
 * Run: pnpm run verify:production-auth-flow
 */
import { chromium, firefox, webkit } from '@playwright/test';
import { CANONICAL_AUTH_URL } from './lib/canonical-origin.mjs';

const PRODUCTION_AUTH = process.env.PRODUCTION_AUTH_URL ?? CANONICAL_AUTH_URL;
const GOOGLE_HOST = 'accounts.google.com';
const PROVIDER_ERROR_MARKERS = [
  'invalid_client',
  'deleted_client',
  'oauth client was not found',
  'the oauth client was not found',
  'error 401',
  'access blocked',
  'policy violation',
  'authorization error',
];
const GOOGLE_SIGN_IN_MARKERS = [
  'sign in',
  'choose an account',
  'use another account',
  'to continue to',
];

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(pass ? '[PASS]' : '[FAIL]', name, detail);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasProviderError(url, bodyText) {
  const normalized = `${safeDecode(url)}\n${bodyText}`.toLowerCase();
  return PROVIDER_ERROR_MARKERS.find((marker) => normalized.includes(marker)) ?? null;
}

async function waitForGoogleTarget(page, popupPromise) {
  await page
    .waitForURL(
      (url) => url.hostname === GOOGLE_HOST || url.hostname.endsWith('.supabase.co'),
      { timeout: 15_000 },
    )
    .catch(() => null);

  const popup = await popupPromise;
  const target = popup ?? page;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = new URL(target.url());
    if (current.hostname === GOOGLE_HOST) return target;
    await target.waitForTimeout(500);
  }

  return target;
}

async function testBrowser(name, launcher) {
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('auth/') || text.includes('Supabase') || text.includes('Firebase')) {
      consoleErrors.push(text);
    }
  });

  try {
    await page.goto(PRODUCTION_AUTH, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const preAlert =
      (await page.locator('[role="alert"]').textContent().catch(() => null))?.trim() ?? null;
    record(`${name}: no error before click`, preAlert === null, preAlert ?? 'none');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await googleButton.waitFor({ state: 'visible', timeout: 10_000 });
    record(`${name}: Google button visible`, true, 'Continue with Google');

    const popupPromise = page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null);
    await googleButton.click({ noWaitAfter: true });
    const target = await waitForGoogleTarget(page, popupPromise);
    await target.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await target.waitForTimeout(1000);

    const providerUrl = target.url();
    const providerBody =
      (await target.locator('body').innerText({ timeout: 5_000 }).catch(() => '')) ?? '';
    const providerLocation = new URL(providerUrl);
    const providerError = hasProviderError(providerUrl, providerBody);
    const isGoogle = providerLocation.hostname === GOOGLE_HOST;
    const isOAuthErrorPath = providerLocation.pathname.includes('/signin/oauth/error');
    const hasSignInSurface = GOOGLE_SIGN_IN_MARKERS.some((marker) =>
      providerBody.toLowerCase().includes(marker),
    );

    record(
      `${name}: reached Google`,
      isGoogle,
      isGoogle ? providerLocation.hostname : providerUrl.slice(0, 160),
    );
    record(
      `${name}: Google OAuth client accepted`,
      isGoogle && !isOAuthErrorPath && providerError === null && hasSignInSurface,
      providerError ??
        (isOAuthErrorPath
          ? 'Google OAuth error path'
          : hasSignInSurface
            ? 'usable Google sign-in surface'
            : 'Google sign-in surface not detected'),
    );

    const postAlert =
      (await page.locator('[role="alert"]').textContent().catch(() => null))?.trim() ?? null;
    record(`${name}: no app error after click`, postAlert === null, postAlert ?? 'none');
    record(
      `${name}: no production auth console errors`,
      consoleErrors.length === 0,
      consoleErrors.join(' | ') || 'none',
    );

    if (target !== page) await target.close().catch(() => undefined);
  } finally {
    await browser.close();
  }
}

await testBrowser('webkit', webkit);
await testBrowser('chromium', chromium);
await testBrowser('firefox', firefox);

const failed = results.filter((result) => !result.pass);
if (failed.length > 0) {
  console.error('\nFAILED CHECKS:', failed.length);
  process.exit(1);
}

console.log('\nALL CHECKS PASSED:', results.length);
