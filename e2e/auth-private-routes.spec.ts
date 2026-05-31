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
    await page.goto('/auth');

    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/sign in with a secure email link/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send secure access link/i })).toBeVisible();
  });

  for (const route of privateRoutes) {
    test(`redirects signed-out user from ${route} to auth`, async ({ page }) => {
      await page.goto(route);

      await page.waitForURL('**/auth**', { timeout: 60_000 });
      await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    });
  }

  test('does not expose private navigation while signed out', async ({ page }) => {
    await page.goto('/releases');

    await page.waitForURL('**/auth**');
    await expect(page.getByText(/release center/i)).toHaveCount(0);
    await expect(page.getByText(/audit log/i)).toHaveCount(0);
  });
});
