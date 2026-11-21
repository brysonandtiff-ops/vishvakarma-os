import { expect, test } from '@playwright/test';
import {
  activateEditorTool, dismissConsentIfPresent, dismissTutorialIfPresent,
  openProjectActionsMenu, resetWorkspacePrefs,
} from './helpers';

/** Exact SHA VISH editor test. Browser input is automated; physical iPad is not claimed. */
test.use({
  video: 'on',
  screenshot: 'on',
  viewport: { width: 1440, height: 900 },
  launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'] },
});
const name = 'Arc Wall Runtime Proof PR216';
async function readWalls(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const w = window as Window & { __vishFloorPlanEngine?: { getSnapshot(): { manifest: { walls: unknown[] } } } };
    return w.__vishFloorPlanEngine?.getSnapshot().manifest.walls.length ?? -1;
  });
}
test('draw arc, open real 3D, save and reopen', async ({ page }, info) => {
  test.setTimeout(210_000);
  await resetWorkspacePrefs(page);
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
  await dismissTutorialIfPresent(page);
  await dismissConsentIfPresent(page);
  const guided = page.getByRole('button', { name: /dismiss guided start/i });
  if (await guided.isVisible().catch(() => false)) await guided.click({ force: true });

  await openProjectActionsMenu(page);
  await page.getByRole('menuitem', { name: /^new project$/i }).click();
  const dialog = page.getByRole('dialog', { name: /create new project/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Project Name').fill(name);
  await dialog.getByRole('button', { name: /^create project$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15000 });

  const canvas = page.getByTestId('blueprint-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('No visible blueprint canvas');
  const y = box.height * 0.48;
  const start = { x: box.width * 0.18, y };
  const end = { x: box.width * 0.72, y };
  const bend = { x: box.width * 0.45, y: y - Math.min(105, box.height * 0.18) };
  await activateEditorTool(page, 'Arc Wall');
  await expect(page.getByTestId('tool-rail').getByRole('button', { name: 'Arc Wall' })).toHaveAttribute('aria-pressed', 'true');
  expect(await readWalls(page)).toBe(0);
  await canvas.click({ position: start, force: true });
  await page.waitForTimeout(350);
  await canvas.click({ position: end, force: true });
  await page.waitForTimeout(350);
  await page.mouse.move(box.x + bend.x, box.y + bend.y, { steps: 10 });
  await page.waitForTimeout(400);
  await canvas.click({ position: bend, force: true });
  await expect.poll(() => readWalls(page), { timeout: 15_000 }).toBeGreaterThan(2);
  const wallCount = await readWalls(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'evidence/vish-arc-2d.png' });
  await info.attach('vish-arc-2d', { path: 'evidence/vish-arc-2d.png', contentType: 'image/png' });

  await page.getByRole('button', { name: 'Toggle 3D view' }).click({ force: true });
  const pane = page.locator('.vish-3d-viewport-pane');
  await expect(pane).toBeVisible({ timeout: 30000 });
  await expect(pane.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('3D Preview Unavailable')).toHaveCount(0);
  await page.waitForTimeout(1100);
  const fit = page.getByTestId('viewport-fit-building');
  await expect(fit).toBeVisible();
  await fit.click();
  await page.waitForTimeout(700);
  const sceneProof = await page.evaluate(() => (
    window as Window & { __vish3dSceneProof?: unknown }
  ).__vish3dSceneProof);
  console.log('VISH_3D_SCENE_PROOF', JSON.stringify(sceneProof ?? { error: 'Scene probe not populated' }));
  await info.attach('vish-3d-scene-diagnostics.json', {
    body: Buffer.from(JSON.stringify(sceneProof ?? { error: 'Scene probe unavailable' }, null, 2)),
    contentType: 'application/json',
  });
  const visibleMeshes = (sceneProof as { meshes?: Array<{ inFrustum: boolean }> } | undefined)?.meshes ?? [];
  expect((sceneProof as { wallMeshCount?: number } | undefined)?.wallMeshCount ?? 0)
    .toBeGreaterThan(0);
  expect(visibleMeshes.some((mesh) => mesh.inFrustum)).toBe(true);
  await page.screenshot({ path: 'evidence/vish-arc-3d.png' });
  await info.attach('vish-arc-3d', { path: 'evidence/vish-arc-3d.png', contentType: 'image/png' });

  // Prove the real 3D panel can be closed before the save/reopen step.
  // Headless Chromium software WebGL can lose its context after long captures;
  // keeping it mounted during a React Router navigation makes the round-trip
  // vulnerable to GPU context reset, not a project-data failure.
  const toggle3d = page.getByRole('button', { name: 'Toggle 3D view' });
  await expect(toggle3d).toBeVisible();
  await toggle3d.click();
  await expect(pane).toHaveCount(0, { timeout: 15000 });

  // The main toolbar can collapse when the 3D pane opens. Use the visible
  // real Save button in VISH's persistent left sidebar instead.
  const saveButton = page.getByTestId('editor-sidebar-save');
  await expect(saveButton).toBeVisible({ timeout: 15_000 });
  await saveButton.click({ force: true });
  const savedCount = () => page.evaluate((n) => {
    const saved = JSON.parse(localStorage.getItem('vishvakarma.os.localProjects.v1') || '[]');
    return saved.find((item: { name: string }) => item.name === n)?.manifest.walls.length ?? -1;
  }, name);
  await expect.poll(savedCount, { timeout: 20000 }).toBe(wallCount);
  await page.screenshot({ path: 'evidence/vish-arc-saved.png' });

  // Navigate like a real user through the React Router workspace link rather
  // than forcing a full reload during VISH's PWA/chunk refresh lifecycle.
  const projectsNav = page.getByRole('navigation', { name: 'Primary workspace navigation' })
    .getByRole('link', { name: /projects/i });
  await expect(projectsNav).toBeVisible();
  await projectsNav.click();
  await expect(page).toHaveURL(/\/projects(?:\?|$)/, { timeout: 30_000 });
  const reopen = page.getByRole('button', { name: `Open ${name}` });
  await expect(reopen).toBeVisible({ timeout: 30000 });
  await reopen.click();
  await expect(page).toHaveURL(/\/editor(?:\?|$)/, { timeout: 30000 });
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30000 });
  await expect.poll(() => readWalls(page), { timeout: 20000 }).toBe(wallCount);
  await page.waitForTimeout(450);
  await page.screenshot({ path: 'evidence/vish-arc-reopened.png' });
  await info.attach('vish-arc-reopened', { path: 'evidence/vish-arc-reopened.png', contentType: 'image/png' });
  await info.attach('exact-source-proof.json', {
    body: Buffer.from(JSON.stringify({
      project: 'VISH', sha: process.env.SOURCE_SHA ?? process.env.GITHUB_SHA,
      environment: 'Playwright automated Chromium local e2e', wallCount,
      recorded2D: true, observed3DCanvas: true, savedAndReopened: true,
      physicalDeviceVerified: false, nativeEditableArc: false,
    }, null, 2)),
    contentType: 'application/json',
  });
});
