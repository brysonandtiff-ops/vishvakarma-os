import { expect, test, type Page } from '@playwright/test';
import {
  desktopLandscape,
  dismissConsentIfPresent,
  dismissEditorOverlays,
  expect3DPreviewPane,
  iPadLandscape,
  iPadPortrait,
  iPhoneLandscape,
  iPhonePortrait,
  loadSampleProject,
  openExportDialog,
  resetWorkspacePrefs,
} from './helpers';
import { assertNoHorizontalOverflow, assertTouchTargets } from './deviceTouchTargets';

const authDeviceMatrix = [
  ['desktop', desktopLandscape],
  ['ipad-landscape', iPadLandscape],
  ['ipad-portrait', iPadPortrait],
  ['phone-portrait', iPhonePortrait],
  ['phone-landscape', iPhoneLandscape],
] as const;

const protectedRouteSmoke = [
  { path: '/projects', label: 'Projects', text: /your projects/i },
  { path: '/releases', label: 'Releases', text: /release/i },
  { path: '/audit', label: 'Audit', text: /audit/i },
  { path: '/optimization', label: 'Optimization', text: /optimization|design battle/i },
] as const;

async function expectNoCrashBoundary(page: Page) {
  await expect(page.getByText(/an unexpected rendering error occurred/i)).toHaveCount(0);
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
}

async function expectGoogleOnlyAuth(page: Page) {
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('google-sso-button')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/continue with google sso/i)).toBeVisible();

  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/magic link/i)).toHaveCount(0);
  await expect(page.getByText(/enter local workspace/i)).toHaveCount(0);
  await expect(page.getByText(/continue with apple/i)).toHaveCount(0);
  await expect(page.getByText(/forgot password/i)).toHaveCount(0);
}

test.describe('QE engineering pass — auth and route smoke', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
  });

  for (const [deviceName, viewport] of authDeviceMatrix) {
    test(`auth is Google SSO-only and safe on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await dismissConsentIfPresent(page);
      await expectGoogleOnlyAuth(page);
      await expectNoCrashBoundary(page);
      await assertNoHorizontalOverflow(page);
      await assertTouchTargets(page, ['button', 'a.touch-target'], viewport.width < 700 ? 42 : 44);
    });
  }

  test('public marketing routes render without crash or overflow', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: /try lite editor/i })).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);

    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('tab', { name: /all features/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /all features/i }).click({ force: true });
    await expect(page.getByText(/^Available$/i).first()).toBeVisible();
    await expect(page.getByText(/^Preview$/i).first()).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /professional-grade tools/i })).toBeVisible({ timeout: 30_000 });
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
  });

  test('protected workspace routes render in local QE mode', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);

    for (const route of protectedRouteSmoke) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await dismissConsentIfPresent(page);
      await expect(page.getByText(route.text).first()).toBeVisible({ timeout: 30_000 });
      await expectNoCrashBoundary(page);
      await assertNoHorizontalOverflow(page);
    }
  });

  test('full editor critical path: sample, 3D, export', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });

    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /toggle 3d view/i }).click({ force: true });
    await expect3DPreviewPane(page);

    await openExportDialog(page);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');

    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
  });

  test('lite editor recovery path: 2D, 3D, tools, export JSON', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.goto('/editor-lite', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);

    await expect(page.getByTestId('lite-editor-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('lite-blueprint-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('lite-3d-pane')).toBeVisible({ timeout: 30_000 });

    for (const tool of ['Select', 'Wall', 'Door', 'Window', 'Pan', 'Delete']) {
      const button = page.getByRole('button', { name: tool });
      await expect(button).toBeVisible({ timeout: 10_000 });
      await button.click({ force: true });
    }

    await expect(page.getByRole('button', { name: /export json/i })).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
    await assertTouchTargets(page, ['button', 'a.touch-target'], 44);
  });
});
