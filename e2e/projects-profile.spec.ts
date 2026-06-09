import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, iPadLandscape } from './helpers';

test.describe('projects and profile (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });

  test('/projects shows local mode guidance when cloud is unconfigured', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await expect(page.getByText(/local draft mode/i).first()).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    await expect(page.getByText(/firebase|local draft|local workspace/i).first()).toBeVisible();
    await page.locator('button.bg-destructive').click();
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('local draft appears on projects after sample load', async ({ page }) => {
    await dismissEditorOverlays(page);
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'New project' }).click();
    await page.getByLabel('Project Name').fill('E2E Draft');
    await page.getByRole('button', { name: /create project/i }).click();
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/project saved locally/i)).toBeVisible({ timeout: 15_000 });
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'E2E Draft', exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/4 walls · \d+ openings/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
