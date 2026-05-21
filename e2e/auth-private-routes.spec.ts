import { expect, test } from '@playwright/test';

const privateRoutes = [
  '/',
  '/spec-center',
  '/registry',
  '/change-requests',
  '/releases',
  '/audit',
];

test.describe('production auth gate', () => {
  test('renders the auth page for signed-out users', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('heading', { name: /vishvakarma\.os/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /request secure access/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send secure access link/i })).toBeVisible();
  });

  for (const route of privateRoutes) {
    test(`redirects signed-out user from ${route} to auth`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/auth$/);
      await expect(page.getByRole('heading', { name: /request secure access/i })).toBeVisible();
    });
  }

  test('does not expose private navigation while signed out', async ({ page }) => {
    await page.goto('/releases');

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText(/release center/i)).toHaveCount(0);
    await expect(page.getByText(/audit log/i)).toHaveCount(0);
  });
});
