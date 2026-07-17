import { expect, test, type Page } from '@playwright/test';
import {
  assertActiveDialogFitsIpad,
  dismissEditorOverlays,
  dispatchCanvasPointer,
  emulateCoarsePointer,
  expect3DPreviewPane,
  iPadLandscape,
  iPadPortrait,
  loadSampleProject,
  openExportDialog,
  openProjectActionsMenu,
  readEditorMetricCount,
  resetWorkspacePrefs,
  saveProject,
  stopMotionForE2E,
  tapReachable,
} from './helpers';

const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

async function setupIpadEditor(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await emulateCoarsePointer(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetWorkspacePrefs(page);
  await dismissEditorOverlays(page);
  await stopMotionForE2E(page);
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
}

async function activatePersistentTool(page: Page, name: 'Select' | 'Wall' | 'Door' | 'Window') {
  const button = page.getByTestId('tool-rail').getByRole('button', { name, exact: true });
  await button.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await expect(button).toBeVisible({ timeout: 10_000 });
  await tapReachable(button);
  await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
}

async function tapCanvas(
  canvas: import('@playwright/test').Locator,
  point: { x: number; y: number },
  pointerId: number,
  pointerType: 'touch' | 'pen' = 'touch',
) {
  await dispatchCanvasPointer(canvas, 'pointerdown', point, { pointerType, pointerId });
  await canvas.page().waitForTimeout(70);
  await dispatchCanvasPointer(canvas, 'pointerup', point, {
    pointerType,
    pointerId,
    buttons: 0,
  });
  await canvas.page().waitForTimeout(120);
}

async function drawTouchWall(
  canvas: import('@playwright/test').Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await tapCanvas(canvas, from, 71);
  await tapCanvas(canvas, to, 72);
}

async function canvasGeometry(page: Page) {
  const canvas = page.getByTestId('blueprint-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not visible');
  return { canvas, box };
}

async function createNamedLocalProject(page: Page, name: string) {
  await openProjectActionsMenu(page);
  const newProject = page.getByRole('menuitem', { name: /new project/i });
  await newProject.waitFor({ state: 'visible', timeout: 10_000 });
  await newProject.evaluate((element) => (element as HTMLElement).click());
  await expect(page.getByRole('dialog', { name: /create new project/i })).toBeVisible({ timeout: 15_000 });
  await page.getByLabel(/project name/i).fill(name);
  await page.getByRole('button', { name: /create project/i }).click({ force: true });
  await expect(page.getByRole('dialog', { name: /create new project/i })).toBeHidden({ timeout: 15_000 });
}

test.describe('iPad editor workflow', () => {
  test.setTimeout(120_000);

  test('draws wall, places door, and shows properties on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const initialOpenings = await readEditorMetricCount(page, 'Openings');
    const { canvas, box } = await canvasGeometry(page);

    const centerY = box.height * 0.62;
    const from = { x: box.width * 0.32, y: centerY };
    const to = { x: box.width * 0.72, y: centerY };
    const midpoint = { x: (from.x + to.x) / 2, y: centerY };

    await activatePersistentTool(page, 'Wall');
    await drawTouchWall(canvas, from, to);
    await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);

    await activatePersistentTool(page, 'Door');
    await tapCanvas(canvas, midpoint, 73);
    await expect.poll(() => readEditorMetricCount(page, 'Openings'), { timeout: 20_000 }).toBe(initialOpenings + 1);

    await activatePersistentTool(page, 'Select');
    await page.mouse.click(box.x + midpoint.x, box.y + midpoint.y);
    await expect(page.getByText(/wall properties/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('wall-openings-count')).toHaveText('1');
    await expect(page.getByText(BLOCKED_COPY)).toHaveCount(0);
  });

  test('draws wall and shows properties on iPad portrait', async ({ page }) => {
    await setupIpadEditor(page, iPadPortrait);
    const initialWalls = await readEditorMetricCount(page, 'Walls');
    const { canvas, box } = await canvasGeometry(page);

    const centerY = box.height * 0.7;
    const from = { x: box.width * 0.25, y: centerY };
    const to = { x: box.width * 0.7, y: centerY };
    const midpoint = { x: (from.x + to.x) / 2, y: centerY };

    await activatePersistentTool(page, 'Wall');
    await drawTouchWall(canvas, from, to);
    await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(initialWalls + 1);

    await activatePersistentTool(page, 'Select');
    await page.mouse.click(box.x + midpoint.x, box.y + midpoint.y);
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 15_000 });
  });

  test('undo reverts wall draw on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    const wallsBefore = await readEditorMetricCount(page, 'Walls');
    const { canvas, box } = await canvasGeometry(page);

    await activatePersistentTool(page, 'Wall');
    await drawTouchWall(
      canvas,
      { x: box.width * 0.3, y: box.height * 0.66 },
      { x: box.width * 0.72, y: box.height * 0.66 },
    );
    await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(wallsBefore + 1);

    await tapReachable(page.getByRole('button', { name: /^undo$/i }));
    await expect.poll(() => readEditorMetricCount(page, 'Walls'), { timeout: 20_000 }).toBe(wallsBefore);
  });

  test('named local project persists after reload on iPad landscape', async ({ page }) => {
    await setupIpadEditor(page, iPadLandscape);
    await createNamedLocalProject(page, 'E2E iPad Draft');
    await loadSampleProject(page);
    await saveProject(page);
    await expect(page.getByText(/project saved locally/i)).toBeVisible({ timeout: 15_000 });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/E2E iPad Draft/i).first()).toBeVisible({ timeout: 30_000 });
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

    await tapReachable(page.getByRole('button', { name: /toggle 3d view/i }));
    await expect3DPreviewPane(page);

    const statusText = await page.locator('.ws-status-bar').textContent();
    expect(statusText).toMatch(new RegExp(`Walls:\\s*${walls2d}`, 'i'));
    expect(statusText).toMatch(new RegExp(`Openings:\\s*${openings2d}`, 'i'));
  });
});
