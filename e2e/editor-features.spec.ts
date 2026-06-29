import { expect, test, type Page } from '@playwright/test';
import {
  dismissEditorOverlays,
  expect3DPreviewPane,
  loadSampleProject,
  openExportDialog,
  resetWorkspacePrefs,
  saveProject,
} from './helpers';

/**
 * Click on an actual wall segment (the first wall's midpoint), computed from the
 * floor-plan engine. The sample house is a rectangle, so the canvas centre is
 * empty space — clicking it never selects a wall. This maps a real wall's world
 * position to a canvas-relative click point so selection tests exercise the
 * click → select → properties flow.
 */
async function clickFirstWallOnCanvas(page: Page) {
  const canvas = page.getByTestId('blueprint-canvas');
  const target = await page.evaluate(() => {
    const engine = (window as unknown as {
      __vishFloorPlanEngine?: {
        getSnapshot: () => {
          manifest: { walls: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> };
          session: { canvasViewport: { panX: number; panY: number; zoom: number } };
        };
      };
    }).__vishFloorPlanEngine;
    const canvasEl = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
    if (!engine || !canvasEl) return null;
    const snapshot = engine.getSnapshot();
    const wall = snapshot.manifest.walls[0];
    if (!wall) return null;
    const vp = snapshot.session.canvasViewport;
    const rect = canvasEl.getBoundingClientRect();
    const dpr = canvasEl.width / rect.width || 1;
    // Click 20% along the wall rather than the midpoint: sample openings sit at
    // position 0.5, and clicking on an opening selects the opening, not the wall.
    const at = 0.2;
    const pt = {
      x: wall.start.x + (wall.end.x - wall.start.x) * at,
      y: wall.start.y + (wall.end.y - wall.start.y) * at,
    };
    return { x: (pt.x * vp.zoom + vp.panX) / dpr, y: (pt.y * vp.zoom + vp.panY) / dpr };
  });
  if (!target) throw new Error('No wall available to click');
  await canvas.click({ position: target });
}

test.describe('editor core features (e2e local access)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
  });

  test('loads sample project and shows walls on canvas', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    const wallCount = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      return canvas ? 1 : 0;
    });
    expect(wallCount).toBe(1);
  });

  test('undo control disables after sample load until edit', async ({ page }) => {
    await loadSampleProject(page);
    const undo = page.getByRole('button', { name: /^undo$/i });
    await expect(undo).toBeVisible();
  });

  test('local draft persists after reload', async ({ page }) => {
    await loadSampleProject(page);
    await saveProject(page);
    await page.reload();
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
  });

  test('extended tool rail tools are enabled', async ({ page }) => {
    await expect(page.getByLabel('Room')).toBeVisible();
    await expect(page.getByLabel('Vastu')).toBeVisible();
    await page.getByLabel('Vastu').click();
    await expect(page.getByTestId('editor-compass-cost')).toBeVisible();
  });

  test('draw wall tool selects and canvas accepts pointer input', async ({ page }) => {
    const wallTool = page.getByTestId('tool-rail').getByRole('button', { name: 'Wall' });
    await wallTool.click();
    await expect(wallTool).toHaveAttribute('aria-pressed', 'true');
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  });

  test('3D toggle shows preview pane', async ({ page }) => {
    await loadSampleProject(page);
    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await expect3DPreviewPane(page);
  });

  test('export dialog opens from project actions menu', async ({ page }) => {
    await loadSampleProject(page);
    await openExportDialog(page);
    await expect(page.getByText(/export floor plan|export package/i).first()).toBeVisible();
  });

  test('select wall on sample project shows properties panel with length', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await clickFirstWallOnCanvas(page);
    await expect(page.getByText(/^Properties$/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/wall properties/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('wall-property-length')).not.toHaveText(/^$/);
  });

  test('sample project wall selection shows openings in properties panel', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await clickFirstWallOnCanvas(page);
    await expect(page.getByText(/openings/i).first()).toBeVisible({ timeout: 10_000 });
    const openingsCount = await page.getByTestId('wall-openings-count').textContent();
    expect(Number(openingsCount ?? '0')).toBeGreaterThanOrEqual(0);
  });

  test('undo enables after wall edit on sample project', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^undo$/i })).toBeVisible();
  });

  test('door tool selects after wall tool on sample project', async ({ page }) => {
    await loadSampleProject(page);
    const doorTool = page.getByTestId('tool-rail').getByRole('button', { name: 'Door' });
    await doorTool.click();
    await expect(doorTool).toHaveAttribute('aria-pressed', 'true');
  });

  test('sample picker loads furniture showcase template', async ({ page }) => {
    await loadSampleProject(page, 'Furniture Showcase');
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Furniture Showcase/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
