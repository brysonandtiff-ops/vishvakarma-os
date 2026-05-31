import { expect, test } from '@playwright/test';

test.describe('marketing pages', () => {
  test('landing page hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Free/i }).first()).toBeVisible();
  });

  test('features page loads', async ({ page }) => {
    await page.goto('/features');
    await expect(page.getByText(/interactive guides/i)).toBeVisible();
  });

  test('pricing page loads tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Studio')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });
});
