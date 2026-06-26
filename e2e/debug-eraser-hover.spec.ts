import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, loadSampleProject, resetWorkspacePrefs } from './helpers';

const iPadLandscape = { width: 1180, height: 820 };

test('debug: eraser hover after stroke should not delete walls', async ({ page }) => {
  await resetWorkspacePrefs(page);
  await dismissEditorOverlays(page);
  await page.setViewportSize(iPadLandscape);
  await loadSampleProject(page);
  await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });

  const wallTool = page.getByTestId('tool-rail').getByRole('button', { name: 'Wall' });
  await wallTool.tap();

  const box = await page.getByTestId('blueprint-canvas').boundingBox();
  expect(box).not.toBeNull();
  const y = box!.height * 0.45;
  const x1 = box!.width * 0.18;
  const x2 = box!.width * 0.34;
  const midX = (x1 + x2) / 2;
  const hoverX = box!.width * 0.55;

  await page.evaluate(
    ({ x1, x2, midX, hoverX, y }) => {
      const el = document.querySelector<HTMLCanvasElement>('[data-testid="blueprint-canvas"]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dispatch = (type: string, x: number, button = 0, buttons = 1) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 42,
            pointerType: 'pen',
            button,
            buttons: type === 'pointerup' ? 0 : buttons,
            clientX: rect.left + x,
            clientY: rect.top + y,
            pressure: type === 'pointerup' ? 0 : 0.5,
            isPrimary: true,
          }),
        );
      };
      dispatch('pointerdown', x1);
      dispatch('pointermove', x2);
      dispatch('pointerup', x2);
      dispatch('pointerdown', midX, 5, 32);
      dispatch('pointerup', midX, 5, 0);
      dispatch('pointermove', hoverX, 5, 0);
    },
    { x1, x2, midX, hoverX, y },
  );

  await page.waitForTimeout(400);
  await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 15_000 });
});
