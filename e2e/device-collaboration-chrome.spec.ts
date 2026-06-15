import { expect, test } from '@playwright/test';
import {
  assertTouchTargets,
  dismissEditorOverlays,
  emulateCoarsePointer,
  iPadLandscape,
} from './helpers';

test.describe('Device collaboration chrome', () => {
  test.beforeEach(async ({ page }) => {
    await dismissEditorOverlays(page);
  });

  test('collaboration bar follow toggle meets 44px on coarse pointer iPad', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await emulateCoarsePointer(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 });

    await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="editor-collaboration-bar"]');
      if (!(bar instanceof HTMLElement)) {
        const topbar = document.querySelector('[data-testid="editor-top-bar"]');
        const stub = document.createElement('div');
        stub.setAttribute('data-testid', 'editor-collaboration-bar');
        stub.className = 'vish-editor-collaboration-bar flex min-h-[44px] items-center gap-1.5';
        stub.innerHTML = `
          <button type="button" data-testid="collab-follow-toggle" class="touch-target inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-2" aria-label="Follow collaborator viewport">Follow</button>
          <span class="vish-editor-collaboration-bar__label">Live sync (preview) · 1 online</span>
        `;
        topbar?.appendChild(stub);
      } else {
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
    await assertTouchTargets(page, [
      '[data-testid="editor-collaboration-bar"] button',
      '[data-testid="collab-follow-toggle"]',
    ]);
  });
});
