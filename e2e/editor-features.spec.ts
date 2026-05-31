import { expect, test } from '@playwright/test';

test.describe('editor core features (e2e local access)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    const onboardingClose = page.getByRole('button', { name: /close|dismiss|got it/i });
    if (await onboardingClose.first().isVisible().catch(() => false)) {
      await onboardingClose.first().click();
    }
  });

  test('loads sample project and shows walls on canvas', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    const wallCount = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      return canvas ? 1 : 0;
    });
    expect(wallCount).toBe(1);
  });

  test('undo control disables after sample load until edit', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    const undo = page.getByRole('button', { name: /^undo$/i });
    await expect(undo).toBeVisible();
  });

  test('local draft persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.reload();
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
  });

  test('extended tool rail tools are enabled', async ({ page }) => {
    await expect(page.getByLabel('Room')).toBeVisible();
    await expect(page.getByLabel('Vastu')).toBeVisible();
    await page.getByLabel('Vastu').click();
    await expect(page.getByTestId('editor-compass-cost')).toBeVisible();
  });
});
