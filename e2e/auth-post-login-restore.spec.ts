import { expect, test } from '@playwright/test';

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

test.describe('Post-login session restore', () => {
  test('keeps /editor after OAuth cold start with cached session snapshot', async ({ page }) => {
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

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/editor');
    expect(page.url()).not.toContain('/auth');
    await expect(page.getByTestId('auth-mockup-card')).toHaveCount(0);
  });
});
