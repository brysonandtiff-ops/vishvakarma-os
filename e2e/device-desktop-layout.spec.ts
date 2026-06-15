import { expect, test } from '@playwright/test';
import {
  desktopLandscape,
  dismissEditorOverlays,
  emulateFinePointer,
  expect3DPreviewPane,
  resetWorkspacePrefs,
  selectWorkspaceMode,
} from './helpers';

test.describe('Desktop fine-pointer editor chrome', () => {
  test.beforeEach(async ({ page }) => {
    await emulateFinePointer(page);
    await resetWorkspacePrefs(page);
    await page.setViewportSize(desktopLandscape);
    await dismissEditorOverlays(page);
  });

  test('walk mode shows pointer-lock hint on fine pointer desktop', async ({ page }) => {
    test.setTimeout(120_000);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });

    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    await expect(toggle3d).toBeVisible({ timeout: 15_000 });
    await toggle3d.click();
    await expect3DPreviewPane(page);

    const webglUnavailable = page.getByText('3D Preview Unavailable');
    const webglCanvas = page.locator('.vish-3d-viewport-pane canvas').first();
    if (
      (await webglUnavailable.isVisible().catch(() => false)) ||
      !(await webglCanvas.isVisible().catch(() => false))
    ) {
      test.skip(true, 'WebGL unavailable in this environment');
    }

    await selectWorkspaceMode(page, /^walk$/i);

    await expect(page.locator('#vish-3d-walk-hint')).toContainText(/click canvas to enter walk/i, {
      timeout: 30_000,
    });
  });

  test('fine pointer media query is not coarse on desktop project', async ({ page }) => {
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    const isCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    expect(isCoarse).toBe(false);
  });
});
