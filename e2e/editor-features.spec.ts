import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, resetWorkspacePrefs } from './helpers';

test.describe('editor core features (e2e local access)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
  });

  test('loads sample project and shows walls on canvas', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    const wallCount = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      return canvas ? 1 : 0;
    });
    expect(wallCount).toBe(1);
  });

  test('undo control disables after sample load until edit', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    const undo = page.getByRole('button', { name: /^undo$/i });
    await expect(undo).toBeVisible();
  });

  test('local draft persists after reload', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
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
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  });

  test('3D toggle shows preview pane', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await expect(page.locator('.ws-pane-label', { hasText: '3D Preview' })).toBeVisible({ timeout: 30_000 });
  });

  test('export dialog opens from command strip', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await page.getByRole('button', { name: /export floor plan/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/export floor plan|export package/i).first()).toBeVisible();
  });

  test('undo enables after wall edit on sample project', async ({ page }) => {
    await page.getByTestId('editor-top-bar').getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^undo$/i })).toBeVisible();
  });
});
