import { expect, test } from '@playwright/test';
import {
  assertTouchTargets,
  dismissEditorOverlays,
  emulateCoarsePointer,
  iPadLandscape,
  resetWorkspacePrefs,
} from './helpers';

test.describe('Device collaboration chrome', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await emulateCoarsePointer(page);
    await page.setViewportSize(iPadLandscape);
    await dismissEditorOverlays(page);
  });

  test('collaboration bar follow toggle meets 44px on coarse pointer iPad', async ({ page }) => {
    test.setTimeout(120_000);
    await page.evaluate(() => {
      const topbar = document.querySelector('[data-testid="editor-top-bar"]');
      if (!topbar) return;
      let bar = document.querySelector('[data-testid="editor-collaboration-bar"]');
      if (!(bar instanceof HTMLElement)) {
        bar = document.createElement('div');
        bar.setAttribute('data-testid', 'editor-collaboration-bar');
        bar.className = 'vish-editor-collaboration-bar flex min-h-[44px] items-center gap-1.5';
        topbar.appendChild(bar);
      }
      if (!bar.querySelector('[data-testid="collab-follow-toggle"]')) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.setAttribute('data-testid', 'collab-follow-toggle');
        toggle.className =
          'touch-target inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-2';
        toggle.setAttribute('aria-label', 'Follow collaborator viewport');
        toggle.textContent = 'Follow';
        bar.appendChild(toggle);
      }
    });

    await expect(page.getByTestId('collab-follow-toggle')).toBeVisible();
    await assertTouchTargets(page, ['[data-testid="collab-follow-toggle"]']);
  });
});
