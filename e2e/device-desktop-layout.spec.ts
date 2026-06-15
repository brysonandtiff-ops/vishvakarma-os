import { expect, test } from '@playwright/test';
import {
  desktopLandscape,
  dismissConsentIfPresent,
  resetWorkspacePrefs,
} from './helpers';

async function openEditorDesktop(page: import('@playwright/test').Page) {
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await dismissConsentIfPresent(page);
  const skipWelcome = page.getByRole('button', { name: /skip.*start drawing/i });
  if (await skipWelcome.isVisible().catch(() => false)) {
    await skipWelcome.click({ force: true });
  }
  await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 });
}

test.describe('Desktop fine-pointer editor chrome', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await page.setViewportSize(desktopLandscape);
    await openEditorDesktop(page);
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
