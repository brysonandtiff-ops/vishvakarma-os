import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
import {
  assertActiveDialogFitsIpad,
  desktopLandscape,
  dismissEditorOverlays,
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

async function activatePersistentTool(page: Page, name: 'Wall' | 'Door' | 'Window' | 'Pencil' | 'Eraser') {
  const button = page.getByTestId('tool-rail').getByRole('button', { name, exact: true });
  await button.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await expect(button).toBeVisible({ timeout: 10_000 });
  await tapReachable(button);
  await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
}

async function activateMenuItem(item: Locator) {
  await item.waitFor({ state: 'visible', timeout: 10_000 });
  await item.evaluate((element) => (element as HTMLElement).click());
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
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Blueprint canvas is not measurable');
  return { canvas, box };
}

// These four browser interaction checks need real Chromium input. DOM-dispatched
// PointerEvents do not register active pointers and setPointerCapture() then throws.
const chromiumInputSessions = new WeakMap<Page, Promise<CDPSession>>();

async function dispatchCanvasPointer(
  canvas: Locator,
  eventType: 'pointerdown' | 'pointermove' | 'pointerup',
  point: { x: number; y: number },
  options: { pointerType: 'pen' | 'touch'; pointerId?: number; button?: number; buttons?: number },
) {
  if (options.button === 5 || (options.buttons !== undefined && (options.buttons & 32) !== 0)) {
    throw new Error('Chromium CDP cannot emulate pen hardware eraser button 5; see inputHandlers unit tests.');
  }

  const page = canvas.page();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Blueprint canvas is not measurable');
  const x = box.x + point.x;
  const y = box.y + point.y;
  let pendingSession = chromiumInputSessions.get(page);
  if (!pendingSession) {
    pendingSession = page.context().newCDPSession(page);
    chromiumInputSessions.set(page, pendingSession);
  }
  const cdp = await pendingSession;

  if (options.pointerType === 'touch') {
    await cdp.send('Input.dispatchTouchEvent', {
      type: eventType === 'pointerdown' ? 'touchStart' : eventType === 'pointermove' ? 'touchMove' : 'touchEnd',
      touchPoints: eventType === 'pointerup' ? [] : [{ x, y, id: options.pointerId ?? 1, force: 0.5 }],
    });
    return;
  }

  // Chrome assigns the active pen pointerId; the test's illustrative id is not forced.
  await cdp.send('Input.dispatchMouseEvent', {
    type: eventType === 'pointerdown' ? 'mousePressed' : eventType === 'pointermove' ? 'mouseMoved' : 'mouseReleased',
    x,
    y,
    button: eventType === 'pointermove' ? 'none' : 'left',
    buttons: eventType === 'pointerup' ? 0 : 1,
    pointerType: 'pen',
    force: eventType === 'pointerup' ? 0 : 0.5,
    clickCount: eventType === 'pointermove' ? 0 : 1,
  });
}

async function pencilTap(
  canvas: Locator,
  point: { x: number; y: number },
  pointerId: number,
) {
  await dispatchCanvasPointer(canvas, 'pointerdown', point, {
    pointerType: 'pen',
    pointerId,
  });
  await canvas.page().waitForTimeout(70);
  await dispatchCanvasPointer(canvas, 'pointerup', point, {
    pointerType: 'pen',
    pointerId,
    buttons: 0,
  });
  await canvas.page().waitForTimeout(130);
}

async function drawPencilWall(
  canvas: Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await pencilTap(canvas, from, 73);
  await pencilTap(canvas, to, 74);
}

test.describe('current iPad editor interaction contract', () => {
  test.setTimeout(120_000);

  test.describe('native pen and finger input', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Native pen and finger input requires Chromium CDP.');

    test('Apple Pencil taps create a wall on a blank canvas', async ({ page }) => {
      await setupEditor(page, iPadLandscape);
      const initialWalls = await readEditorMetricCount(page, 'Walls');
      const { canvas, box } = await canvasBox(page);

      await activatePersistentTool(page, 'Wall');
      const y = box.height * 0.64;
      await drawPencilWall(
        canvas,
        { x: box.width * 0.3, y },
        { x: box.width * 0.7, y },
      );

      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);
    });

    test('Visible eraser removes a Wall-tool wall with the Pencil tip', async ({ page }) => {
      await setupEditor(page, iPadLandscape);
      const initialWalls = await readEditorMetricCount(page, 'Walls');
      const { canvas, box } = await canvasBox(page);

      await activatePersistentTool(page, 'Wall');
      const y = box.height * 0.7;
      const from = { x: box.width * 0.32, y };
      const to = { x: box.width * 0.72, y };
      const midpoint = { x: (from.x + to.x) / 2, y };
      await drawPencilWall(canvas, from, to);
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);

      // CDP cannot send a real pen hardware-eraser button. That input mapping
      // is independently covered in src/test/inputHandlers.test.ts.
      await activatePersistentTool(page, 'Eraser');
      await dispatchCanvasPointer(canvas, 'pointerdown', midpoint, {
        pointerType: 'pen',
        pointerId: 84,
      });
      await page.waitForTimeout(80);
      await dispatchCanvasPointer(canvas, 'pointerup', midpoint, {
        pointerType: 'pen',
        pointerId: 84,
        buttons: 0,
      });

      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls);
    });

    test('finger pencil drawing, rubbing eraser, and one-step Undo restore walls', async ({ page }) => {
      await setupEditor(page, iPadLandscape);
      const initialWalls = await readEditorMetricCount(page, 'Walls');
      const { canvas, box } = await canvasBox(page);
      const from = { x: box.width * 0.3, y: box.height * 0.63 };
      const to = { x: box.width * 0.72, y: from.y };

      await activatePersistentTool(page, 'Pencil');
      await dispatchCanvasPointer(canvas, 'pointerdown', from, { pointerId: 91, pointerType: 'touch' });
      for (let step = 1; step <= 6; step += 1) {
        await dispatchCanvasPointer(canvas, 'pointermove', {
          x: from.x + (to.x - from.x) * step / 6,
          y: from.y,
        }, { pointerId: 91, pointerType: 'touch' });
      }
      await dispatchCanvasPointer(canvas, 'pointerup', to, {
        pointerId: 91, pointerType: 'touch', buttons: 0,
      });
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);

      await activatePersistentTool(page, 'Eraser');
      const midpoint = { x: (from.x + to.x) / 2, y: from.y };
      await dispatchCanvasPointer(canvas, 'pointerdown', midpoint, {
        pointerId: 92, pointerType: 'touch',
      });
      await dispatchCanvasPointer(canvas, 'pointermove', { x: midpoint.x + 32, y: midpoint.y }, {
        pointerId: 92, pointerType: 'touch',
      });
      await dispatchCanvasPointer(canvas, 'pointerup', { x: midpoint.x + 32, y: midpoint.y }, {
        pointerId: 92, pointerType: 'touch', buttons: 0,
      });
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls);

      await page.keyboard.press('Control+z');
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);
    });

    test('Apple Pencil tip can erase using the visible tool without a hardware eraser button', async ({ page }) => {
      await setupEditor(page, iPadLandscape);
      const initialWalls = await readEditorMetricCount(page, 'Walls');
      const { canvas, box } = await canvasBox(page);
      const from = { x: box.width * 0.33, y: box.height * 0.67 };
      const to = { x: box.width * 0.7, y: from.y };
      await activatePersistentTool(page, 'Pencil');
      await dispatchCanvasPointer(canvas, 'pointerdown', from, { pointerId: 93, pointerType: 'pen' });
      await dispatchCanvasPointer(canvas, 'pointermove', to, { pointerId: 93, pointerType: 'pen' });
      await dispatchCanvasPointer(canvas, 'pointerup', to, { pointerId: 93, pointerType: 'pen', buttons: 0 });
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);

      await activatePersistentTool(page, 'Eraser');
      const midpoint = { x: (from.x + to.x) / 2, y: from.y };
      await dispatchCanvasPointer(canvas, 'pointerdown', midpoint, {
        pointerId: 94, pointerType: 'pen', button: 0, buttons: 1,
      });
      await dispatchCanvasPointer(canvas, 'pointerup', midpoint, {
        pointerId: 94, pointerType: 'pen', button: 0, buttons: 0,
      });
      await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls);
    });
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
        await activatePersistentTool(page, tool);
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
