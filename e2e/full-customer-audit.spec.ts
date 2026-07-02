import { expect, test, type Page } from '@playwright/test';
import {
  desktopLandscape,
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

const deviceMatrix = [
  ['desktop', desktopLandscape],
  ['ipad-landscape', iPadLandscape],
  ['ipad-portrait', iPadPortrait],
  ['phone-portrait', iPhonePortrait],
  ['phone-landscape', iPhoneLandscape],
] as const;

async function expectGoogleOnlyAuth(page: Page) {
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('google-sso-button')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/continue with google sso/i)).toBeVisible();
  await expect(page.getByText(/magic link/i)).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.getByText(/enter local workspace/i)).toHaveCount(0);
}

test.describe('full real-customer device audit', () => {
  test.setTimeout(120_000);

  for (const [deviceName, viewport] of deviceMatrix) {
    test(`auth is Google-only and layout-safe on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await expectGoogleOnlyAuth(page);
      await assertNoHorizontalOverflow(page);
      await assertTouchTargets(page, ['button', 'a.touch-target'], viewport.width < 700 ? 42 : 44);
    });
  }

  for (const [deviceName, viewport] of [
    ['desktop', desktopLandscape],
    ['ipad-landscape', iPadLandscape],
    ['ipad-portrait', iPadPortrait],
  ] as const) {
    test(`editor controls, sample load, export, and 3D preview work on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await resetWorkspacePrefs(page);
      await dismissEditorOverlays(page);
      await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
      await loadSampleProject(page);
      await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

      const rail = page.getByTestId('tool-rail');
      for (const tool of ['Wall', 'Door', 'Window', 'Room']) {
        const button = rail.getByRole('button', { name: tool });
        await expect(button).toBeVisible({ timeout: 10_000 });
        await button.click({ force: true });
        await expect(button).toHaveAttribute('aria-pressed', 'true');
      }

      await page.getByRole('button', { name: /toggle 3d view/i }).click({ force: true });
      await expect3DPreviewPane(page);

      await openExportDialog(page);
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
      await page.keyboard.press('Escape');

      await assertNoHorizontalOverflow(page);
    });
  }
});
