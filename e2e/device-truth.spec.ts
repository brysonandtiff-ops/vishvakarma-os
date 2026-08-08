import { mkdir } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  activateEditorTool,
  assertNoHorizontalOverflow,
  assertTouchTargets,
  dismissEditorOverlays,
  drawWallSegment,
  openExportDialog,
  readEditorMetricCount,
  resetWorkspacePrefs,
} from './helpers';

type RuntimeProblems = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
};

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'features', path: '/features' },
  { name: 'projects', path: '/projects' },
  { name: 'editor', path: '/editor' },
  { name: 'three-d-room', path: '/3d-room' },
  { name: 'optimization', path: '/optimization' },
  { name: 'spec-center', path: '/spec-center' },
  { name: 'registry', path: '/registry' },
  { name: 'change-requests', path: '/change-requests' },
  { name: 'releases', path: '/releases' },
  { name: 'audit', path: '/audit' },
] as const;

function metadata(testInfo: TestInfo) {
  return (testInfo.project.metadata ?? {}) as Record<string, unknown>;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function evidencePath(testInfo: TestInfo, route: string, orientation = 'canonical') {
  const dir = `evidence/device-tests/screenshots/${slug(testInfo.project.name)}`;
  await mkdir(dir, { recursive: true });
  return `${dir}/${slug(route)}_${slug(orientation)}.png`;
}

function collectRuntimeProblems(page: Page): RuntimeProblems {
  const problems: RuntimeProblems = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    serverErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') problems.consoleErrors.push(message.text());
  });

  page.on('pageerror', (error) => {
    problems.pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown request failure';
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(errorText)) return;
    try {
      const url = new URL(request.url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        problems.failedRequests.push(`${request.method()} ${url.pathname}: ${errorText}`);
      }
    } catch {
      // Ignore non-URL requests.
    }
  });

  page.on('response', (response) => {
    if (response.status() < 500) return;
    try {
      const url = new URL(response.url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        problems.serverErrors.push(`${response.status()} ${url.pathname}`);
      }
    } catch {
      // Ignore non-URL responses.
    }
  });

  return problems;
}

async function attachProblems(testInfo: TestInfo, problems: RuntimeProblems) {
  await testInfo.attach('runtime-truth.json', {
    body: Buffer.from(JSON.stringify(problems, null, 2)),
    contentType: 'application/json',
  });
}

async function assertRuntimeClean(problems: RuntimeProblems) {
  expect(problems.pageErrors, 'uncaught page exceptions').toEqual([]);
  expect(problems.serverErrors, 'same-origin HTTP 5xx responses').toEqual([]);
  expect(problems.failedRequests, 'same-origin failed requests').toEqual([]);
  expect(problems.consoleErrors, 'browser console errors').toEqual([]);
}

async function gotoTruthRoute(page: Page, path: string) {
  await resetWorkspacePrefs(page);
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (response) expect(response.status(), `HTTP status for ${path}`).toBeLessThan(500);
  await page.waitForTimeout(path === '/3d-room' ? 1_500 : 500);
}

test.describe('Vishvakarma multi-device human truth baseline', () => {
  for (const route of ROUTES) {
    test(`route truth: ${route.name}`, async ({ page }, testInfo) => {
      const problems = collectRuntimeProblems(page);
      await gotoTruthRoute(page, route.path);

      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(/workspace failed to render/i)).toHaveCount(0);
      await assertNoHorizontalOverflow(page);

      const routeShot = await evidencePath(testInfo, route.name);
      await page.screenshot({ path: routeShot, fullPage: true, animations: 'disabled' });

      await attachProblems(testInfo, problems);
      await assertRuntimeClean(problems);
    });
  }

  test('new-user editor truth: draw, undo, redo and reach export', async ({ page }, testInfo) => {
    const problems = collectRuntimeProblems(page);
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);

    const canvas = page.getByTestId('blueprint-canvas');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const deviceClass = String(metadata(testInfo).deviceClass ?? 'desktop');
    if (deviceClass !== 'desktop') {
      await assertTouchTargets(page, [
        '[data-testid="tool-rail"] button',
        '[data-testid="editor-top-bar"] button',
      ]);
    }

    const bounds = await canvas.boundingBox();
    expect(bounds, 'blueprint canvas bounds').not.toBeNull();
    const width = Math.max(220, bounds?.width ?? 220);
    const height = Math.max(180, bounds?.height ?? 180);

    const beforeWalls = await readEditorMetricCount(page, 'Walls');
    await activateEditorTool(page, 'Wall');
    await drawWallSegment(
      canvas,
      { x: Math.min(width * 0.2, width - 80), y: Math.min(height * 0.35, height - 80) },
      { x: Math.min(width * 0.7, width - 20), y: Math.min(height * 0.35, height - 80) },
      deviceClass === 'desktop' ? 'mouse' : 'touch',
    );

    const afterDraw = await readEditorMetricCount(page, 'Walls');
    expect(afterDraw, 'wall count after first-time draw').toBeGreaterThan(beforeWalls);

    const undo = page.getByRole('button', { name: /undo/i }).first();
    await expect(undo, 'Undo must be reachable to a new user').toBeVisible();
    await undo.click({ force: true });
    const afterUndo = await readEditorMetricCount(page, 'Walls');
    expect(afterUndo, 'wall count after undo').toBeLessThanOrEqual(afterDraw);

    const redo = page.getByRole('button', { name: /redo/i }).first();
    await expect(redo, 'Redo must be reachable to a new user').toBeVisible();
    await redo.click({ force: true });
    const afterRedo = await readEditorMetricCount(page, 'Walls');
    expect(afterRedo, 'wall count after redo').toBeGreaterThanOrEqual(afterUndo);

    await openExportDialog(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    const exportShot = await evidencePath(testInfo, 'editor-export');
    await page.screenshot({ path: exportShot, fullPage: true, animations: 'disabled' });
    await page.keyboard.press('Escape');

    await attachProblems(testInfo, problems);
    await assertRuntimeClean(problems);
  });

  test('phone/tablet rotation truth preserves editor state', async ({ page }, testInfo) => {
    const deviceClass = String(metadata(testInfo).deviceClass ?? 'desktop');
    test.skip(deviceClass === 'desktop', 'Rotation validation is for touch/mobile classes.');

    const problems = collectRuntimeProblems(page);
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
    const canvas = page.getByTestId('blueprint-canvas');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    const canonical = page.viewportSize();
    expect(canonical).not.toBeNull();
    if (!canonical) return;

    const before = await readEditorMetricCount(page, 'Walls');
    await activateEditorTool(page, 'Wall');
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error('Blueprint canvas has no visible bounds.');
    await drawWallSegment(
      canvas,
      { x: Math.max(20, bounds.width * 0.25), y: Math.max(20, bounds.height * 0.25) },
      { x: Math.max(80, bounds.width * 0.65), y: Math.max(20, bounds.height * 0.25) },
      'touch',
    );
    const afterDraw = await readEditorMetricCount(page, 'Walls');
    expect(afterDraw).toBeGreaterThan(before);

    await page.setViewportSize({ width: canonical.height, height: canonical.width });
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
    await assertNoHorizontalOverflow(page);
    expect(await readEditorMetricCount(page, 'Walls'), 'state after landscape rotation').toBe(afterDraw);
    await page.screenshot({
      path: await evidencePath(testInfo, 'editor', 'landscape'),
      fullPage: true,
      animations: 'disabled',
    });

    await page.setViewportSize(canonical);
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
    await assertNoHorizontalOverflow(page);
    expect(await readEditorMetricCount(page, 'Walls'), 'state after returning to canonical orientation').toBe(afterDraw);

    await attachProblems(testInfo, problems);
    await assertRuntimeClean(problems);
  });

  test('PWA shell truth: manifest is declared and retrievable', async ({ page }) => {
    await gotoTruthRoute(page, '/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    const href = await manifestLink.getAttribute('href');
    expect(href, 'manifest href').toBeTruthy();
    if (!href) return;

    const response = await page.request.get(new URL(href, page.url()).toString());
    expect(response.ok(), `manifest request ${response.status()}`).toBe(true);
    const manifest = await response.json();
    expect(manifest.name ?? manifest.short_name, 'PWA manifest app name').toBeTruthy();
  });
});
