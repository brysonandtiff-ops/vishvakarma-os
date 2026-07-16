import { test, expect } from '@playwright/test';

test.describe('Authentication and Private Route Gate', () => {
  const privateRoutes = [
    '/editor',
    '/spec-center',
    '/registry',
    '/change-requests',
    '/releases',
    '/world-records',
    '/audit',
  ];

  for (const route of privateRoutes) {
    test(`redirects unauthenticated user from ${route} to /auth`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForURL('**/auth**', { timeout: 60_000 });
      await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });
    });
  }

  test('renders the compact auth page correctly in iPad portrait and landscape modes', async ({ page }) => {
    test.setTimeout(90_000);

    for (const viewport of [
      { width: 810, height: 1080 },
      { width: 1080, height: 810 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('google-sso-button')).toBeVisible();
      await expect(page.getByTestId('auth-trust-pillars')).toBeHidden();
    }
  });
});
