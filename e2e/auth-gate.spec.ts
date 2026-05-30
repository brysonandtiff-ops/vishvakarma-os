import { test, expect } from '@playwright/test';

test.describe('Authentication and Private Route Gate', () => {
  // List of production routes that should be protected behind the auth gate
  const privateRoutes = [
    '/',
    '/spec-center',
    '/registry',
    '/change-requests',
    '/releases',
    '/audit',
  ];

  for (const route of privateRoutes) {
    test(`redirects unauthenticated user from ${route} to /auth`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL('**/auth**', { timeout: 60_000 });
      await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    });
  }

  test('renders auth page correctly in iPad portrait and landscape modes', async ({ page }) => {
    test.setTimeout(90_000);

    await page.setViewportSize({ width: 810, height: 1080 });
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });

    await page.setViewportSize({ width: 1080, height: 810 });
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
  });
});