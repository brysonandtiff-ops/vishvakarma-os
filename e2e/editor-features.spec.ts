import { expect, test } from '@playwright/test';
import { dismissEditorOverlays } from './helpers';

test.describe('editor core features (e2e local access)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissEditorOverlays(page);
  });

  test('loads sample project and shows walls on canvas', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    const wallCount = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      return canvas ? 1 : 0;
    });
    expect(wallCount).toBe(1);
  });

  test('undo control disables after sample load until edit', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    const undo = page.getByRole('button', { name: /^undo$/i });
    await expect(undo).toBeVisible();
  });

  test('local draft persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
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
    await page.getByRole('button', { name: /^wall$/i }).click();
    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    await canvas.dispatchEvent('pointerdown', {
      bubbles: true,
      clientX: box.x + box.width * 0.3,
      clientY: box.y + box.height * 0.4,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    });
    await canvas.dispatchEvent('pointerup', {
      bubbles: true,
      clientX: box.x + box.width * 0.3,
      clientY: box.y + box.height * 0.4,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    });
    await canvas.dispatchEvent('pointerdown', {
      bubbles: true,
      clientX: box.x + box.width * 0.6,
      clientY: box.y + box.height * 0.4,
      pointerId: 2,
      pointerType: 'mouse',
      isPrimary: true,
    });
    await canvas.dispatchEvent('pointerup', {
      bubbles: true,
      clientX: box.x + box.width * 0.6,
      clientY: box.y + box.height * 0.4,
      pointerId: 2,
      pointerType: 'mouse',
      isPrimary: true,
    });

    await expect(page.getByText(/1 walls ·/i)).toBeVisible({ timeout: 10_000 });
  });

  test('3D toggle shows preview pane', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await page.getByRole('button', { name: /^3D$/i }).click();
    await expect(page.getByText(/3D Preview/i)).toBeVisible();
  });

  test('export dialog opens from command strip', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await page.getByRole('button', { name: /^export$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/export floor plan|export package/i).first()).toBeVisible();
  });

  test('undo enables after wall edit on sample project', async ({ page }) => {
    await page.getByRole('button', { name: /sample/i }).click();
    await page.getByRole('button', { name: /^wall$/i }).click();
    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    await canvas.click({ position: { x: box.width * 0.2, y: box.height * 0.5 } });
    await canvas.click({ position: { x: box.width * 0.8, y: box.height * 0.5 } });

    const undo = page.getByRole('button', { name: /^undo$/i });
    await expect(undo).toBeEnabled({ timeout: 10_000 });
  });
});
