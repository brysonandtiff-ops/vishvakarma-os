import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  assertActiveDialogFitsIpad,
  desktopLandscape,
  dismissEditorOverlays,
  dispatchCanvasPointer,
  iPadLandscape,
  iPadPortrait,
  loadSampleProject,
  openAIDesigner,
  openExportDialog,
  openProjectActionsMenu,
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
  await expect(page.getByTestId('tool-rail')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
}

async function activateDraftingTool(page: Page, toolName: 'Wall' | 'Door' | 'Window') {
  const button = page.getByTestId('tool-rail').getByRole('button', { name: toolName, exact: true });
  await button.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await expect(button).toBeVisible({ timeout: 10_000 });

  await button.evaluate((element) => {
    const init = { bubbles: true, cancelable: true, button: 0 };
    element.dispatchEvent(new PointerEvent('pointerdown', {
      ...init,
      buttons: 1,
      pointerId: 61,
      pointerType: 'touch',
      isPrimary: true,
    }));
    element.dispatchEvent(new PointerEvent('pointerup', {
      ...init,
      buttons: 0,
      pointerId: 61,
      pointerType: 'touch',
      isPrimary: true,
    }));
  });

  await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
}

async function activateMenuItem(item: Locator) {
  await item.waitFor({ state: 'visible', timeout: 10_000 });
  await item.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

async function expect3DPane(page: Page) {
  const pane = page.locator('.vish-3d-viewport-pane');
  await pane.waitFor({ state: 'attached', timeout: 30_000 });
  await pane.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
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

async function drawPencilWall(
  canvas: Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await dispatchCanvasPointer(canvas, 'pointerdown', from, {
    pointerType: 'pen',
    pointerId: 73,
  });
  await canvas.page().waitForTimeout(80);
  await dispatchCanvasPointer(canvas, 'pointerup', from, {
    pointerType: 'pen',
    pointerId: 73,
    buttons: 0,
  });
  await canvas.page().waitForTimeout(140);

  await dispatchCanvasPointer(canvas, 'pointerdown', to, {
    pointerType: 'pen',
    pointerId: 74,
  });
  await canvas.page().waitForTimeout(80);
  await dispatchCanvasPointer(canvas, 'pointerup', to, {
    pointerType: 'pen',
    pointerId: 74,
    buttons: 0,
  });
  await canvas.page().waitForTimeout(160);
}

test.describe('current iPad editor interaction contract', () => {
  test.setTimeout(120_000);

  test('staged Apple Pencil taps create a wall', async ({ page }) => {
    await setupEditor(page, iPadLandscape);
    await loadSampleProject(page);
    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const { canvas, box } = await canvasBox(page);

    await activateDraftingTool(page, 'Wall');
    const y = box.height * 0.72;
    await drawPencilWall(
      canvas,
      { x: box.width * 0.58, y },
      { x: box.width * 0.82, y },
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

    await activateDraftingTool(page, 'Wall');
    const y = box.height * 0.78;
    const from = { x: box.width * 0.56, y };
    const to = { x: box.width * 0.80, y };
    const midpoint = { x: (from.x + to.x) / 2, y };
    await drawPencilWall(canvas, from, to);
    await expect
      .poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 })
      .toBeGreaterThan(initialWalls);

    await dispatchCanvasPointer(canvas, 'pointerdown', midpoint, {
      pointerType: 'pen',
      pointerId: 84,
      button: 5,
      buttons: 32,
    });
    await page.waitForTimeout(80);
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

    await openProjectActionsMenu(page);
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
    await openAIDesigner(page);
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

      for (const tool of ['Wall', 'Door', 'Window'] as const) {
        await activateDraftingTool(page, tool);
      }
      const room = page.getByTestId('tool-rail').getByRole('button', { name: 'Room', exact: true });
      await room.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await expect(room).toBeVisible();

      await tapReachable(page.getByRole('button', { name: /toggle 3d view/i }));
      await expect3DPane(page);
      await openExportDialog(page);
      await assertActiveDialogFitsIpad(page);
    });
  }
});
