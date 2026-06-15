import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  dismissConsentIfPresent,
  dismissEditorOverlays,
  loadSampleProject,
  openExportDialog,
  resetWorkspacePrefs,
} from './helpers';

const OUT_DIR = join(process.cwd(), 'docs/release/evidence/screenshots');

function shot(page: import('@playwright/test').Page, name: string) {
  return page.screenshot({
    path: join(OUT_DIR, name),
    fullPage: false,
  });
}

test.describe('release screenshot pack', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures marketing and editor screenshots', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await shot(page, '01-landing-hero.png');

    await page.goto('/auth');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    await shot(page, '02-auth-email-link.png');

    await resetWorkspacePrefs(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await shot(page, '03-editor-2d-sample.png');

    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, '04-editor-3d-premium.png');

    await openExportDialog(page);
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await shot(page, '05-export-package-dialog.png');
    await page.keyboard.press('Escape');

    await page.goto('/projects');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await shot(page, '06-projects-empty.png');

    await page.goto('/features');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('tab', { name: /all features/i })).toBeVisible();
    await page.getByRole('tab', { name: /all features/i }).click();
    await expect(page.getByText(/Available now in the editor/i).first()).toBeVisible();
    await shot(page, '07-features-ready-badges.png');
  });
});
