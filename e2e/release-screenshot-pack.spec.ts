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

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBe(false);
}

test.describe('release screenshot pack', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures truthful marketing, auth, editor, and governance screenshots', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '01-landing-hero.png');

    await page.goto('/auth');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    await expect(page.getByTestId('google-sso-button')).toBeVisible();
    await expect(page.getByText(/magic link/i)).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await shot(page, '02-auth-google-sso.png');

    await resetWorkspacePrefs(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '03-editor-2d-sample.png');

    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await expect(page.locator('.vish-3d-viewport-pane')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await shot(page, '04-editor-3d-premium.png');

    await openExportDialog(page);
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await shot(page, '05-export-package-dialog.png');
    await page.keyboard.press('Escape');

    await page.goto('/editor-lite');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('lite-editor-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('lite-blueprint-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('lite-3d-pane')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /export json/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '06-editor-lite-recovery.png');

    await page.goto('/projects');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '07-projects-empty.png');

    await page.goto('/features');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('tab', { name: /all features/i })).toBeVisible();
    await page.getByRole('tab', { name: /all features/i }).click();
    await expect(page.getByTestId('features-panel-all')).toBeVisible();
    await expect(page.getByText(/2D Drafting/i).first()).toBeVisible();
    await expect(page.getByText(/^Available$/i).first()).toBeVisible();
    await expect(page.getByText(/^Preview$/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '08-features-truth-badges.png');

    await page.goto('/pricing');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /professional-grade tools/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, '09-pricing-tiers.png');

    await page.goto('/optimization');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/optimization|design battle/i).first()).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
    await shot(page, '10-optimization-empty.png');

    await page.goto('/releases');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/release/i).first()).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
    await shot(page, '11-releases.png');

    await page.goto('/world-records');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/world records/i).first()).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
    await shot(page, '12-world-records.png');

    await page.goto('/audit');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/audit/i).first()).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
    await shot(page, '13-audit.png');
  });
});
