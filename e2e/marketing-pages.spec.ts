import { expect, test } from '@playwright/test';

async function expectNotFound(page: import('@playwright/test').Page) {
  await expect(page.getByText('404').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /route not found/i })).toBeVisible();
}

test.describe('marketing pages', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.setTimeout(60_000);

  test('landing page hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Free/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /See All Features/i }).first()).toBeVisible();
    await expect(page.getByText(/Blueprint to chamber/i).first()).toBeVisible();
    await expect(page.getByText(/Built for professional delivery/i).first()).toBeVisible();
    await expect(page.locator('.vish-workflow-strip')).toBeVisible();
  });

  test('features page loads tabs and guide opens editor', async ({ page }) => {
    await page.goto('/features');
    await expect(page.getByTestId('features-tab-guides')).toBeVisible();
    await expect(page.getByTestId('features-tab-all')).toBeVisible();
    await page.getByRole('button', { name: /your first floor plan/i }).click();
    await expect(page).toHaveURL(/\/editor$/);
  });

  test('features page guide opens editor via nav Start Free', async ({ page }) => {
    await page.goto('/features');
    await page.getByRole('link', { name: /start free/i }).first().click();
    await expect(page).toHaveURL(/\/(auth|editor)$/);
  });

  test('/404 and unknown paths show not found page', async ({ page }) => {
    await page.goto('/404');
    await expectNotFound(page);

    await page.goto('/this-route-does-not-exist');
    await expectNotFound(page);
  });

  test('/pricing is not registered while flag is off', async ({ page }) => {
    await page.goto('/pricing');
    await expectNotFound(page);
  });

  test('/reset-password redirects to auth with notice', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText(/password reset is not available/i)).toBeVisible();
  });
});
