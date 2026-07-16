import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  activateEditorTool,
  assertActiveDialogFitsIpad,
  desktopLandscape,
  dismissEditorOverlays,
  dispatchCanvasPointer,
  drawWallSegment,
  iPadLandscape,
  iPadPortrait,
  loadSampleProject,
  openExportDialog,
  readEditorMetricCount,
  resetWorkspacePrefs,
  tapReachable,
} from './helpers';

async function setupEditor(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetWorkspacePrefs(page);
  await dismissEditorOverlays(page);
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
}

async function openProjectMenu(page: Page) {
  const trigger = page.getByRole('button', { name: /project actions/i }).first();
  await trigger.waitFor({ state: 'visible', timeout: 15_000 });
  await trigger.scrollIntoViewIfNeeded().catch(() => {});
  await trigger.focus();
  await trigger.press('Enter');

  const firstItem = page.getByRole('menuitem').first();
  if (!(await firstItem.isVisible({ timeout: 2_000 }).catch(() => false))) {
    await trigger.press('ArrowDown').catch(() => {});
  }
  if (!(await firstItem.isVisible({ timeout: 2_000 }).catch(() => false))) {
    await trigger.evaluate((element) => {
      const init = { bubbles: true, cancelable: true, button: 0 };
      element.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1, pointerType: 'mouse' }));
      element.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, pointerType: 'mouse' }));
      (element as HTMLElement).click();
    });
  }
  await firstItem.waitFor({ state: 'visible', timeout: 10_000 });
}

async function activateMenuItem(item: Locator) {
  await item.waitFor({ state: 'visible', timeout: 10_000 });
  await item.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

async function expect3DPane(page: Page) {
  const pane = page.locator('.vish-3d-viewport-pane');
  await expect(pane).toBeVisible({ timeout: 30_000 });
  const fallback = page.getByText('3D Preview Unavailable');
  if (await fallback.isVisible().catch(() => false)) return;
  await expect(pane.locator('canvas').first()).toBeAttached({ timeout: 30_000 });
}

async function canvasBox(page: Page) {
  const canvas = page.getByTestId('blueprint-canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Blueprint canvas is not measurable');
  return { canvas, box };
}

test.describe('current iPad editor interaction contract', () => {
  test.setTimeout(120_000);

  test('staged Apple Pencil stroke creates a wall', async ({ page }) => {
    await setupEditor(page, iPadLandscape);
    await loadSampleProject(page);
    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const { canvas, box } = await canvasBox(page);

    await activateEditorTool(page, 'Wall');
    const y = box.height * 0.55;
    await drawWallSegment(
      canvas,
      { x: box.width * 0.15, y },
      { x: box.width * 0.36, y },
      'pen',
    );

    await expect
      .poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 })
      .toBeGreaterThan(initialWalls);
  });

  test('staged Pencil eraser deletes the created wall', async ({ page }) => {
    await setupEditor(page, iPadLandscape);
    await loadSampleProject(page);
    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const { canvas, box } = await canvasBox(page);

    await activateEditorTool(page, 'Wall');
    const y = box.height * 0.45;
    const from = { x: box.width * 0.18, y };
    const to = { x: box.width * 0.38, y };
    const midpoint = { x: (from.x + to.x) / 2, y };
    await drawWallSegment(canvas, from, to, 'pen');
    await expect
      .poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 })
      .toBeGreaterThan(initialWalls);

    await dispatchCanvasPointer(canvas, 'pointerdown', midpoint, {
      pointerType: 'pen',
      pointerId: 84,
      button: 5,
      buttons: 32,
    });
    await page.waitForTimeout(60);
    await dispatchCanvasPointer(canvas, 'pointerup', midpoint, {
      pointerType: 'pen',
      pointerId: 84,
      button: 5,
      buttons: 0,
    });

    await expect
      .poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 })
      .toBe(initialWalls);
  });

  test('project, export and Copilot dialogs remain reachable across iPad orientations', async ({ page }) => {
    await setupEditor(page, iPadPortrait);

    await openProjectMenu(page);
    await activateMenuItem(page.getByRole('menuitem', { name: /new project/i }));
    const createDialog = page.getByRole('dialog', { name: /create new project/i });
    await expect(createDialog).toBeVisible({ timeout: 15_000 });
    await assertActiveDialogFitsIpad(page);
    await page.getByRole('button', { name: /cancel/i }).first().click({ force: true });
    await expect(createDialog).toBeHidden();

    await openExportDialog(page);
    const exportDialog = page.getByRole('dialog', { name: /export package/i });
    await expect(exportDialog).toBeVisible({ timeout: 15_000 });
    await assertActiveDialogFitsIpad(page);
    await page.getByRole('button', { name: /cancel/i }).first().click({ force: true });
    await expect(exportDialog).toBeHidden();

    await page.setViewportSize(iPadLandscape);
    await openProjectMenu(page);
    await activateMenuItem(page.getByTestId('editor-ai-designer'));
    await expect(page.getByRole('dialog', { name: /ai architecture copilot/i })).toBeVisible({ timeout: 15_000 });
    await assertActiveDialogFitsIpad(page);
  });

  for (const [deviceName, viewport] of [
    ['desktop', desktopLandscape],
    ['ipad-landscape', iPadLandscape],
    ['ipad-portrait', iPadPortrait],
  ] as const) {
    test(`current editor workflow remains functional on ${deviceName}`, async ({ page }) => {
      await setupEditor(page, viewport);
      await loadSampleProject(page);

      for (const tool of ['Wall', 'Door', 'Window', 'Room']) {
        await activateEditorTool(page, tool);
      }

      await tapReachable(page.getByRole('button', { name: /toggle 3d view/i }));
      await expect3DPane(page);
      await openExportDialog(page);
      await assertActiveDialogFitsIpad(page);
    });
  }
});
