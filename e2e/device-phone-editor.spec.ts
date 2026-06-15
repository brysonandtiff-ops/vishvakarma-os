import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  dismissEditorOverlays,
  iPhonePortrait,
  resetWorkspacePrefs,
} from './helpers';

async function dismissOnboardingIfPresent(page: import('@playwright/test').Page) {
  const dismiss = page.getByRole('button', { name: /dismiss|close|got it|skip/i });
  if (await dismiss.first().isVisible().catch(() => false)) {
    await dismiss.first().click();
  }
}

test.describe('Device phone editor layout', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
    await dismissOnboardingIfPresent(page);
  });

  test('editor workspace fits iPhone portrait without horizontal overflow', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('editor zoom controls meet 44px touch targets on iPhone portrait', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
    await assertTouchTargets(page, [
      '.vish-canvas-zoom-btn',
      '[data-testid="tool-rail"] button',
      '[data-testid="editor-top-bar"] button',
    ]);
  });

  test('inline label editor keeps canvas visible when keyboard inset applies', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="blueprint-canvas"]');
      const stage = canvas?.closest('.vish-canvas-stage') ?? canvas?.parentElement;
      if (stage instanceof HTMLElement) {
        stage.style.paddingBottom = '280px';
      }
    });

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  });
});
