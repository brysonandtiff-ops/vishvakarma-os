import { expect, test } from '@playwright/test';
import {
  dismissEditorOverlays,
  loadSampleProject,
  resetWorkspacePrefs,
} from './helpers';

test.describe('editor performance smoke', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
  });

  test('sample project reaches interactive canvas quickly', async ({ page }) => {
    const started = Date.now();
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    const elapsed = Date.now() - started;
    console.log(`editor-canvas-interactive-ms=${elapsed}`);
    expect(elapsed).toBeLessThan(35_000);
  });

  test('3D preview becomes visible within budget after sample load', async ({ page }) => {
    await loadSampleProject(page);
    const started = Date.now();
    const toggle = page.getByRole('button', { name: /toggle 3d view/i }).first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click({ force: true });
    }

    const pane = page.locator('.vish-3d-viewport-pane');
    await pane.waitFor({ state: 'attached', timeout: 30_000 });
    await pane.scrollIntoViewIfNeeded().catch(() => {});
    await expect(pane).toBeVisible({ timeout: 30_000 });

    const fallback = page.getByText('3D Preview Unavailable');
    if (!(await fallback.isVisible().catch(() => false))) {
      await expect(pane.locator('canvas').first()).toBeAttached({ timeout: 30_000 });
    }

    const elapsed = Date.now() - started;
    console.log(`editor-3d-preview-ms=${elapsed}`);
    expect(elapsed).toBeLessThan(45_000);
  });
});
