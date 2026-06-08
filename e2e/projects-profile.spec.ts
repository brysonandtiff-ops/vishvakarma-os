import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, iPadLandscape } from './helpers';

test.describe('projects and profile (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });

  test('/projects shows local mode guidance when cloud is unconfigured', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await expect(page.getByText(/local draft mode/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /new in editor|open editor/i }).first()).toBeVisible();
  });

  test('new in editor CTA navigates to editor', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: /new in editor/i }).click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
  });

  test('/profile shows backend mode and sign out redirects to auth', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible();
    await expect(page.getByText(/firebase|local draft|local workspace/i).first()).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('local draft appears on projects after sample load', async ({ page }) => {
    await dismissEditorOverlays(page);
    await page.getByRole('button', { name: /sample/i }).click();
    await expect(page.getByText(/\d+ walls · \d+ openings/i).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);
    await page.goto('/projects');
    await expect(page.getByText(/walls · .* openings/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
