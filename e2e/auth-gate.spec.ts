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
      await page.waitForURL('**/auth**');
      await expect(page.getByText('VISHVAKARMA.OS')).toBeVisible();
    });
  }

  test('renders auth page correctly in iPad portrait and landscape modes', async ({ page }) => {
    // Test iPad Portrait
    await page.setViewportSize({ width: 810, height: 1080 });
    await page.goto('/auth');
    
    // Basic assertion to ensure the DOM loaded and rendered without crashing
    await expect(page.locator('body')).toBeVisible();

    // Test iPad Landscape
    await page.setViewportSize({ width: 1080, height: 810 });
    await expect(page.locator('body')).toBeVisible();
  });
});