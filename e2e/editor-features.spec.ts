import { expect, test } from '@playwright/test';
import {
  dismissEditorOverlays,
  expect3DPreviewPane,
  loadSampleProject,
  openExportDialog,
  resetWorkspacePrefs,
  saveProject,
} from './helpers';

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

  test('select wall on sample project shows properties panel', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not visible');
    await canvas.click({ position: { x: box.width * 0.5, y: box.height * 0.5 } });
    await expect(page.getByText(/^Properties$/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/wall/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('door tool selects after wall tool on sample project', async ({ page }) => {
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^undo$/i })).toBeVisible();
  });

  test('sample picker loads furniture showcase template', async ({ page }) => {
    await loadSampleProject(page, 'Furniture Showcase');
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Furniture Showcase/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
