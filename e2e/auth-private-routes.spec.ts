import { expect, test } from '@playwright/test';

const privateRoutes = [
  '/editor',
  '/spec-center',
  '/registry',
  '/change-requests',
  '/releases',
  '/world-records',
  '/audit',
];

test.describe('production auth gate', () => {
  test('renders the auth page for signed-out users', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('google-sso-button')).toBeVisible();
    await expect(page.getByTestId('google-sso-button')).toHaveText(/continue with google sso/i);
    await expect(page.getByText(/sign in with google sso or request a secure one-time email link through supabase/i)).toBeVisible();
    await expect(page.getByTestId('email-magic-link-input')).toBeVisible();
    await expect(page.getByTestId('email-magic-link-button')).toHaveText(/email me a sign-in link/i);
  });

  for (const route of privateRoutes) {    test(`redirects signed-out user from ${route} to auth`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/auth(?:\?|$)/, { timeout: 15_000 });
      await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    });
  }

  test('does not expose private navigation while signed out', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
    for (const route of privateRoutes) {
      await expect(page.locator(`a[href="${route}"]`)).toHaveCount(0);
    }
  });
});
