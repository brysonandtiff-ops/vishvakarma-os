import { expect, test } from '@playwright/test';
import {
  activateEditorTool,
  assertActiveDialogFitsIpad,
  dismissEditorOverlays,
  drawWallSegmentTouch,
  emulateCoarsePointer,
  expect3DPreviewPane,
  iPadLandscape,
  iPadPortrait,
  loadSampleProject,
  openExportDialog,
  readEditorMetricCount,
  resetWorkspacePrefs,
  saveProject,
  selectDrawnWallForProperties,
  stopMotionForE2E,
  dispatchCanvasTouchPointer,
} from './helpers';

const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

async function setupIpadEditor(page: import('@playwright/test').Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await emulateCoarsePointer(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetWorkspacePrefs(page);
  await dismissEditorOverlays(page);
  await stopMotionForE2E(page);
}

test.describe('iPad editor workflow', () => {
  test.setTimeout(120_000);

  test('draws wall, places door, and shows properties on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    await loadSampleProject(page);

    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const initialOpenings = await readEditorMetricCount(page, 'Openings');

    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not visible');

    const centerY = box.height * 0.5;
    const from = { x: box.width * 0.25, y: centerY };
    const to = { x: box.width * 0.75, y: centerY };

    await activateEditorTool(page, 'Wall');
    await drawWallSegmentTouch(canvas, from, to);

    await expect
      .poll(async () => readEditorMetricCount(page, 'Walls'), { timeout: 15_000 })
      .toBeGreaterThan(initialWalls);

    await activateEditorTool(page, 'Door');
    const doorPoint = { x: box.width * 0.5, y: centerY };
    await dispatchCanvasTouchPointer(canvas, 'pointerdown', doorPoint);
    await dispatchCanvasTouchPointer(canvas, 'pointerup', doorPoint);

    await expect
      .poll(async () => readEditorMetricCount(page, 'Openings'), { timeout: 15_000 })
      .toBeGreaterThan(initialOpenings);

    await activateEditorTool(page, 'Select');
    await selectDrawnWallForProperties(page);

    await expect(page.getByText(/wall properties/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('wall-openings-count')).toHaveText('1');
    await expect(page.getByText(BLOCKED_COPY)).toHaveCount(0);
  });

  test('draws wall, places door, and shows properties on iPad portrait', async ({ page }) => {
    await setupIpadEditor(page, iPadPortrait);
    await loadSampleProject(page);

    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not visible');

    const centerY = box.height * 0.45;
    await activateEditorTool(page, 'Wall');
    await drawWallSegmentTouch(
      canvas,
      { x: box.width * 0.2, y: centerY },
      { x: box.width * 0.7, y: centerY },
    );

    await expect
      .poll(async () => readEditorMetricCount(page, 'Walls'), { timeout: 15_000 })
      .toBeGreaterThan(initialWalls);

    await activateEditorTool(page, 'Select');
    await selectDrawnWallForProperties(page);
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 10_000 });
  });

  test('undo reverts wall draw on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    await loadSampleProject(page);

    const wallsBefore = await readEditorMetricCount(page, 'Walls');
    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not visible');

    await activateEditorTool(page, 'Wall');
    await drawWallSegmentTouch(
      canvas,
      { x: box.width * 0.15, y: box.height * 0.4 },
      { x: box.width * 0.35, y: box.height * 0.4 },
    );

    await expect
      .poll(async () => readEditorMetricCount(page, 'Walls'), { timeout: 15_000 })
      .toBeGreaterThan(wallsBefore);

    const undo = page.getByRole('button', { name: /^undo$/i });
    await undo.click();
    await expect
      .poll(async () => readEditorMetricCount(page, 'Walls'), { timeout: 10_000 })
      .toBe(wallsBefore);
  });

  test('local draft persists after reload on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    await loadSampleProject(page);
    await saveProject(page);
    await page.reload();
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 30_000 });
  });

  test('export dialog fits iPad portrait', async ({ page }) => {
    await setupIpadEditor(page, iPadPortrait);
    await loadSampleProject(page);
    await openExportDialog(page);
    await assertActiveDialogFitsIpad(page);
  });

  test('2D and 3D counts stay in parity after sample load on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    await loadSampleProject(page);

    const walls2d = await readEditorMetricCount(page, 'Walls');
    const openings2d = await readEditorMetricCount(page, 'Openings');

    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await expect3DPreviewPane(page);

    const statusText = await page.locator('.ws-status-bar').textContent();
    expect(statusText).toMatch(new RegExp(`Walls:\\s*${walls2d}`, 'i'));
    expect(statusText).toMatch(new RegExp(`Openings:\\s*${openings2d}`, 'i'));
  });
});
