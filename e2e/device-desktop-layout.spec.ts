import { expect, test } from '@playwright/test';
import { desktopLandscape, dismissEditorOverlays, resetWorkspacePrefs } from './helpers';

test.describe('Desktop fine-pointer editor chrome', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await page.setViewportSize(desktopLandscape);
    await dismissEditorOverlays(page);
  });

  test('walk mode shows pointer-lock hint on fine pointer desktop', async ({ page }) => {
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });

    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    await expect(toggle3d).toBeVisible({ timeout: 15_000 });
    await toggle3d.click();
    await page.waitForTimeout(500);

    const walkTab = page.getByRole('button', { name: /^walk$/i });
    if (await walkTab.isVisible()) {
      await walkTab.click();
    } else {
      await page.locator('.vish-editor-mode-badge').click();
      await page.getByRole('menuitem', { name: /^walk$/i }).click();
    }

    await expect(page.locator('#vish-3d-walk-hint')).toContainText(/click canvas to enter walk/i, {
      timeout: 20_000,
    });
  });

  test('fine pointer media query is not coarse on desktop project', async ({ page }) => {
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    const isCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    expect(isCoarse).toBe(false);
  });
});
