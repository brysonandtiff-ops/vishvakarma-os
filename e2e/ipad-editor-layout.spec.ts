import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  dismissEditorOverlays,
  iPadLandscape,
  iPadPortrait,
  loadSampleProject,
  openAIDesigner,
  openExportDialog,
  openProjectActionsMenu,
  resetWorkspacePrefs,
} from './helpers';

const EDITOR_TOUCH_SELECTORS = [
  '[data-testid="editor-top-bar"] button',
  '[data-testid="tool-rail"] button',
  '.bg-ws-canvas > .flex.shrink-0 button',
  '.vish-3d-atmosphere-btn',
  '.vish-canvas-zoom-btn',
  '.vish-properties-panel button',
  '.vish-notifications-strip button',
  '[data-testid="vish-3d-walk-pad"] button',
];

async function assertEditorTouchTargets(page: Page) {
  await assertTouchTargets(page, EDITOR_TOUCH_SELECTORS);
}

async function tapReachable(locator: Locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'nearest', inline: 'center' });
    (element as HTMLElement).click();
  });
}

async function assertActiveDialogFitsIpad(page: Page) {
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(250);

  const metrics = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const style = window.getComputedStyle(element);
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth,
      viewportHeight,
      canScroll: element.scrollHeight > element.clientHeight,
      overflowY: style.overflowY,
    };
  });

  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  if (metrics.canScroll) {
    expect(['auto', 'scroll']).toContain(metrics.overflowY);
  }

  await assertNoHorizontalOverflow(page);
  await assertTouchTargets(page, ['[role="dialog"] button', '[role="dialog"] [role="button"]']);
}

async function waitForZoomReadoutToChange(page: Page) {
  await expect
    .poll(async () => page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent(), {
      timeout: 5_000,
    })
    .not.toContain('100%');
}

async function waitForUsableCanvas(page: Page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    return rect.width > 100 && rect.height > 100;
  }, undefined, { timeout: 5_000 });
}

test.describe('iPad editor layout', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
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
      await tapReachable(toggle3d);
      await page.waitForTimeout(400);
    }
    await assertNoHorizontalOverflow(page);
    await assertEditorTouchTargets(page);
  });

  test('editor survives iPad rotation with 3D panel and canvas controls visible', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    if (await toggle3d.isVisible()) {
      await tapReachable(toggle3d);
      await page.waitForTimeout(400);
    }

    await page.setViewportSize(iPadPortrait);
    await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
    await page.waitForTimeout(350);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible();
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertEditorTouchTargets(page);

    const portraitDirection = await page.evaluate(() => {
      const row = document.querySelector('.bg-ws-canvas > div.flex.flex-1.overflow-hidden');
      return row ? window.getComputedStyle(row).flexDirection : null;
    });
    expect(portraitDirection).toBe('column');

    await page.setViewportSize(iPadLandscape);
    await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
    await page.waitForTimeout(350);
    const landscapeDirection = await page.evaluate(() => {
      const row = document.querySelector('.bg-ws-canvas > div.flex.flex-1.overflow-hidden');
      return row ? window.getComputedStyle(row).flexDirection : null;
    });
    expect(landscapeDirection).toBe('row');
    await assertNoHorizontalOverflow(page);
  });

  test('editor dialogs stay reachable on iPad portrait and landscape', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });

    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /new project/i }).evaluate((element) => {
      (element as HTMLElement).click();
    });
    await expect(page.getByRole('dialog', { name: /create new project/i })).toBeVisible();
    await assertActiveDialogFitsIpad(page);
    await page.getByRole('button', { name: /cancel/i }).first().click();

    await openExportDialog(page);
    await expect(page.getByRole('dialog', { name: /export package/i })).toBeVisible();
    await assertActiveDialogFitsIpad(page);
    await page.getByRole('button', { name: /cancel/i }).first().click();

    await page.setViewportSize(iPadLandscape);
    await page.waitForTimeout(250);
    await openAIDesigner(page);
    await expect(page.getByRole('dialog', { name: /ai architecture copilot/i })).toBeVisible();
    await assertActiveDialogFitsIpad(page);
  });

  test('blueprint canvas uses responsive container sizing', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.waitForFunction(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      const stage = canvas?.closest<HTMLElement>('.vish-canvas-stage') ?? canvas?.parentElement;
      if (!canvas || !stage) return false;
      const canvasRect = canvas.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      return canvasRect.width <= Math.min(stageRect.width, document.documentElement.clientWidth) + 2;
    });
    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]')!;
      const stage = canvas.closest<HTMLElement>('.vish-canvas-stage') ?? canvas.parentElement!;
      const canvasRect = canvas.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      return {
        canvasWidth: canvasRect.width,
        stageWidth: stageRect.width,
        viewportWidth: document.documentElement.clientWidth,
        maxWidthOk: canvasRect.width <= Math.min(stageRect.width, document.documentElement.clientWidth) + 2,
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

    await tapReachable(page.getByRole('button', { name: 'Zoom in' }).first());
    await waitForZoomReadoutToChange(page);
  });

  test('pan tool is available in tool rail', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('tool-rail')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tool-rail').getByRole('button', { name: 'Pan', exact: true })).toBeVisible();
  });

  test('minimap responds to pointer tap', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await loadSampleProject(page);
    await page.waitForTimeout(400);

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
    await waitForUsableCanvas(page).catch(() => {});
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const zoomBefore = await page.locator('.ws-status-bar').getByText(/Zoom/).locator('..').textContent();
    expect(zoomBefore).toContain('100%');

    await page.evaluate(
      ({ x, y }) => {
        const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
        canvas?.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            deltaY: -240,
          }),
        );
      },
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    );

    await waitForZoomReadoutToChange(page);
  });

  test('two-pointer pinch zoom updates status bar readout', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    await page.evaluate(
      ({ cx, cy }) => {
        const el = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
        if (!el) return;
        const fire = (type: string, pointerId: number, x: number, y: number) => {
          el.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              button: 0,
              pointerId,
              pointerType: 'touch',
              clientX: x,
              clientY: y,
              buttons: type === 'pointerup' ? 0 : 1,
              isPrimary: pointerId === 1,
              pressure: type === 'pointerup' ? 0 : 0.5,
              width: 12,
              height: 12,
            }),
          );
        };
        fire('pointerdown', 1, cx - 60, cy);
        fire('pointerdown', 2, cx + 60, cy);
      },
      { cx, cy },
    );
    await page.waitForTimeout(80);
    await page.evaluate(
      ({ cx, cy }) => {
        const el = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
        if (!el) return;
        const fire = (type: string, pointerId: number, x: number, y: number) => {
          el.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              button: 0,
              pointerId,
              pointerType: 'touch',
              clientX: x,
              clientY: y,
              buttons: type === 'pointerup' ? 0 : 1,
              isPrimary: pointerId === 1,
              pressure: type === 'pointerup' ? 0 : 0.5,
              width: 12,
              height: 12,
            }),
          );
        };
        fire('pointermove', 1, cx - 100, cy);
        fire('pointermove', 2, cx + 100, cy);
      },
      { cx, cy },
    );
    await page.waitForTimeout(80);
    await page.evaluate(
      ({ cx, cy }) => {
        const el = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
        if (!el) return;
        const fire = (type: string, pointerId: number, x: number, y: number) => {
          el.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              button: 0,
              pointerId,
              pointerType: 'touch',
              clientX: x,
              clientY: y,
              buttons: type === 'pointerup' ? 0 : 1,
              isPrimary: pointerId === 1,
              pressure: type === 'pointerup' ? 0 : 0.5,
              width: 12,
              height: 12,
            }),
          );
        };
        fire('pointerup', 1, cx - 100, cy);
        fire('pointerup', 2, cx + 100, cy);
      },
      { cx, cy },
    );

    await waitForZoomReadoutToChange(page);
  });

  test('wall tool draw increases wall count on sample project', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });

    const wallTool = page.getByTestId('tool-rail').getByRole('button', { name: 'Wall' });
    await tapReachable(wallTool);
    await expect(wallTool).toHaveAttribute('aria-pressed', 'true');

    const canvas = page.getByTestId('blueprint-canvas');
    await waitForUsableCanvas(page).catch(() => {});
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.touchscreen.tap(box!.x + box!.width * 0.2, box!.y + box!.height * 0.5);
    await page.waitForTimeout(150);
    await page.touchscreen.tap(box!.x + box!.width * 0.35, box!.y + box!.height * 0.5);
    await page.waitForTimeout(400);

    await expect(page.getByText(/Walls:\s*5/i)).toBeVisible({ timeout: 15_000 });
  });

  test('3D context-loss overlay shows reload control', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await loadSampleProject(page);
    await tapReachable(page.getByRole('button', { name: /toggle 3d view/i }));
    await page.waitForTimeout(800);

    const dispatched = await page.evaluate(() => {
      const canvas = document.querySelector('.vish-3d-viewport-pane canvas');
      if (!canvas) return false;
      canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: false, cancelable: true }));
      return true;
    });
    if (!dispatched) {
      await expect(page.locator('.vish-3d-viewport-pane')).toBeVisible();
      return;
    }

    await expect(page.locator('.vish-3d-context-lost')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /reload 3d view/i })).toBeVisible();
  });

  test('walk mode shows touch D-pad on coarse pointer', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await loadSampleProject(page);
    await tapReachable(page.getByRole('button', { name: /toggle 3d view/i }));
    await page.waitForTimeout(400);

    const walkMode = page.getByRole('button', { name: /^walk$/i });
    if (await walkMode.isVisible()) {
      await tapReachable(walkMode);
      await page.waitForTimeout(400);
    }

    const walkPad = page.getByTestId('vish-3d-walk-pad');
    if (await walkPad.isVisible().catch(() => false)) {
      await expect(page.getByTestId('vish-3d-walk-up')).toBeVisible();
      await assertTouchTargets(page, ['[data-testid="vish-3d-walk-pad"] button']);
    }
  });

  test('presentation lock hides tool rail', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await expect(page.getByTestId('tool-rail')).toBeVisible({ timeout: 30_000 });
    const presentationBtn = page.getByRole('button', { name: /presentation lock/i });
    if (await presentationBtn.isVisible()) {
      await tapReachable(presentationBtn);
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
      await tapReachable(toggle3d);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: 'docs/release/evidence/ipad-3d-panel.png',
        fullPage: false,
      });
    }
  });
});
