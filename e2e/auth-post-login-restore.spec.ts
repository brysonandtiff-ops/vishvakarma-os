import { expect, test, type Page } from '@playwright/test';

const SESSION_STORAGE_KEY = 'vishvakarma.os.supabase.session.v1';

function buildSessionSnapshot() {
  return {
    provider: 'supabase',
    uid: 'e2e-restore-user',
    email: 'architect@firm.com',
    idToken: 'e2e-restore-access-token',
    refreshToken: 'e2e-restore-refresh-token',
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

async function seedCachedSession(page: Page) {
  await page.addInitScript(
    ({ key, snapshot }) => {
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    },
    { key: SESSION_STORAGE_KEY, snapshot: buildSessionSnapshot() }
  );

  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: null, token_type: 'bearer', user: null }),
    });
  });
}

async function expectEditorLanding(page: Page) {
  await page.waitForURL('**/editor**', { timeout: 15_000 });

  expect(page.url()).not.toContain('/auth');
  await expect(page.getByTestId('auth-mockup-card')).toHaveCount(0);
}

test.describe('Post-login session restore', () => {
  test('keeps /editor after OAuth cold start with cached session snapshot', async ({ page }) => {
    await seedCachedSession(page);
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expectEditorLanding(page);
  });

  test('keeps /editor on iPhone viewport after cached session cold start', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedCachedSession(page);
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expectEditorLanding(page);
  });

  test('keeps /editor on iPad landscape after cached session cold start', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await seedCachedSession(page);
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expectEditorLanding(page);
  });

  test('redirects signed-in user from /auth to /editor', async ({ page }) => {
    await seedCachedSession(page);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/editor**', { timeout: 15_000 });
    await expect(page.getByTestId('auth-mockup-card')).toHaveCount(0);
  });
});
