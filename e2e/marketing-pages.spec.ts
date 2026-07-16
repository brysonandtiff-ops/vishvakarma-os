import { expect, test } from '@playwright/test';

async function settlePublicUi(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
  });
}

async function expectNotFound(
  page: import('@playwright/test').Page,
  heading: RegExp = /page not found|route not found/i,
) {
  await expect(page.getByText('404').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20_000 });
}

test.describe('marketing pages', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await settlePublicUi(page);
  });

  test('landing page hero and CTA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', {
      name: /draw floor plans.*review in 3d.*export proof/i,
    })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: /start free/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /explore the features/i }).first()).toBeVisible();
    await expect(page.getByText(/a complete project path, not just a toolbar/i)).toBeVisible();
    await expect(page.getByText(/nothing ships unless it is specified, gated, and provable/i)).toBeVisible();
    await expect(page.locator('.vish-workflow-strip')).toBeVisible();
  });

  test('features page loads tabs and guide opens editor', async ({ page }) => {
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('features-tab-guides')).toBeVisible();
    await expect(page.getByTestId('features-tab-all')).toBeVisible();
    await page.getByRole('button', { name: /your first floor plan/i }).click();
    await expect(page).toHaveURL(/\/editor$/);
  });

  test('features page guide opens editor via nav Start Free', async ({ page }) => {
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /start free/i }).first().click();
    await expect(page).toHaveURL(/\/(auth|editor)$/);
  });

  test('/404 and unknown paths show their correct not-found page', async ({ page }) => {
    await page.goto('/404', { waitUntil: 'domcontentloaded' });
    await expectNotFound(page, /page not found/i);

    await page.goto('/this-route-does-not-exist', { waitUntil: 'domcontentloaded' });
    await expectNotFound(page, /route not found/i);
  });

  test('/pricing is not registered while flag is off', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expectNotFound(page, /route not found/i);
  });

  test('/reset-password redirects to auth with notice', async ({ page }) => {
    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText(/password reset is not available/i)).toBeVisible({ timeout: 15_000 });
  });
});
