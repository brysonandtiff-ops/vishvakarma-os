import { expect, test, type Page } from '@playwright/test';

const LEGACY_SESSION_STORAGE_KEY = 'vishvakarma.os.supabase.session.v1';

function buildLegacySessionSnapshot() {
  return {
    provider: 'supabase',
    uid: 'legacy-e2e-user',
    email: 'architect@firm.com',
    idToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

async function seedLegacyCachedSession(page: Page) {
  await page.addInitScript(
    ({ key, snapshot }) => {
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    },
    { key: LEGACY_SESSION_STORAGE_KEY, snapshot: buildLegacySessionSnapshot() },
  );

  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: null, token_type: 'bearer', user: null }),
    });
  });
}

async function expectLegacySessionRejected(page: Page) {
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /continue with google sso/i })).toBeVisible();
  await expect.poll(
    () => page.evaluate((key) => window.localStorage.getItem(key), LEGACY_SESSION_STORAGE_KEY),
  ).toBeNull();
}

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'iPhone', width: 390, height: 844 },
  { name: 'iPad landscape', width: 1180, height: 820 },
];

test.describe('Hardened post-login session restore', () => {
  for (const viewport of viewports) {
    test(`rejects a legacy cached token on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await seedLegacyCachedSession(page);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await expectLegacySessionRejected(page);
    });
  }
});
