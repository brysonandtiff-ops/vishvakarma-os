import { expect, test } from '@playwright/test';

const iPadLandscape = { width: 1180, height: 820 };
const iPadPortrait = { width: 820, height: 1180 };

async function dismissOnboardingIfPresent(page: import('@playwright/test').Page) {
  const dismiss = page.getByRole('button', { name: /dismiss|close|got it|skip/i });
  if (await dismiss.first().isVisible().catch(() => false)) {
    await dismiss.first().click();
  }
}

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow).toBe(false);
}

async function assertEditorTouchTargets(page: import('@playwright/test').Page) {
  const tooSmall = await page.evaluate(() => {
    const selectors = [
      '[data-testid="editor-top-bar"] button',
      '[data-testid="tool-rail"] button',
      '.bg-ws-canvas > .flex.shrink-0 button',
      '.vish-3d-atmosphere-btn',
      '.vish-canvas-zoom-btn',
      '.vish-properties-panel button',
      '.vish-notifications-strip button',
    ];
    const buttons = selectors.flatMap((sel) => Array.from(document.querySelectorAll<HTMLButtonElement>(sel)));
    const seen = new Set<Element>();
    const failures: string[] = [];
    for (const button of buttons) {
      if (seen.has(button)) continue;
      seen.add(button);
      const rect = button.getBoundingClientRect();
      const style = window.getComputedStyle(button);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
        continue;
      }
      if (rect.width < 44 || rect.height < 44) {
        failures.push(`${button.getAttribute('aria-label') ?? button.textContent?.trim() ?? 'button'}: ${rect.width}x${rect.height}`);
      }
    }
    return failures;
  });
  expect(tooSmall, `Touch targets below 44px: ${tooSmall.join(', ')}`).toEqual([]);
}

test.describe('iPad editor layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    const skipWelcome = page.getByRole('button', { name: /skip.*start drawing/i });
    if (await skipWelcome.isVisible().catch(() => false)) {
      await skipWelcome.click();
    }
    await dismissOnboardingIfPresent(page);
  });

  test('editor workspace fits iPad landscape', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertEditorTouchTargets(page);
  });

  test('editor workspace fits iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertEditorTouchTargets(page);
  });

  test('editor portrait with 3D panel open avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    if (await toggle3d.isVisible()) {
      await toggle3d.click();
      await page.waitForTimeout(400);
    }
    await assertNoHorizontalOverflow(page);
    await assertEditorTouchTargets(page);
  });

  test('blueprint canvas uses responsive container sizing', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      const container = canvas?.parentElement;
      if (!canvas || !container) return null;
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return {
        canvasWidth: canvasRect.width,
        containerWidth: containerRect.width,
        maxWidthOk: canvasRect.width <= containerRect.width + 1,
      };
    });
    expect(metrics).not.toBeNull();
    expect(metrics?.maxWidthOk).toBe(true);
  });

  test('editor keeps horizontal layout on iPad landscape', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });

    const flexDirection = await page.evaluate(() => {
      const row = document.querySelector('.bg-ws-canvas > div.flex.flex-1.overflow-hidden');
      return row ? window.getComputedStyle(row).flexDirection : null;
    });
    expect(flexDirection).toBe('row');
  });

  test('canvas zoom in button updates status bar readout', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    const zoomBefore = await page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent();
    expect(zoomBefore).toContain('100%');

    await page.getByRole('button', { name: 'Zoom in' }).first().click();
    await page.waitForTimeout(200);

    const zoomAfter = await page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent();
    expect(zoomAfter).not.toContain('100%');
  });

  test('pan tool is available in tool rail', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('tool-rail')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tool-rail').getByRole('button', { name: 'Pan', exact: true })).toBeVisible();
  });

  test('minimap responds to pointer tap', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.getByRole('button', { name: 'Project actions' }).click();
    await page.getByRole('menuitem', { name: 'Load sample' }).click();
    await page.getByRole('button', { name: 'Load Blueprint' }).click();
    await page.waitForTimeout(1200);

    await expect(page.getByTestId('canvas-minimap')).toBeVisible({ timeout: 30_000 });

    const minimap = page.getByTestId('canvas-minimap');
    const box = await minimap.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(150);
    await expect(minimap).toBeVisible();
  });

  test('blueprint canvas wheel zoom updates status bar readout', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const zoomBefore = await page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent();
    expect(zoomBefore).toContain('100%');

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(200);

    const zoomAfter = await page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent();
    expect(zoomAfter).not.toContain('100%');
  });

  test('presentation lock hides tool rail', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('tool-rail')).toBeVisible({ timeout: 30_000 });
    const presentationBtn = page.getByRole('button', { name: /presentation lock/i });
    if (await presentationBtn.isVisible()) {
      await presentationBtn.click();
      await expect(page.getByTestId('tool-rail')).not.toBeVisible();
    }
  });

  test('captures iPad editor evidence screenshots', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    await page.screenshot({
      path: 'docs/release/evidence/ipad-editor-landscape.png',
      fullPage: false,
    });

    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    if (await toggle3d.isVisible()) {
      await toggle3d.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: 'docs/release/evidence/ipad-3d-panel.png',
        fullPage: false,
      });
    }
  });
});
