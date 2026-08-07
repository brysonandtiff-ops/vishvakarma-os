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

const OUT_DIR = join(process.cwd(), 'sell-closeout');

function shot(page: import('@playwright/test').Page, name: string) {
  return page.screenshot({
    path: join(OUT_DIR, name),
    fullPage: false,
  });
}

test.describe('sell closeout real evidence pack', () => {
  test.setTimeout(300_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures real UI evidence of all application pages into sell-closeout folder', async ({ page }) => {
    // 01. Landing Page
    await page.goto('/');
    await dismissConsentIfPresent(page);
    await expect(page.locator('body')).toContainText(/Vishvakarma\.OS|Sacred 3D View/i);
    await shot(page, '01-landing-page.png');

    // 02. Auth Page
    await page.goto('/auth');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    await shot(page, '02-auth-page.png');

    // 03. Projects Page
    await resetWorkspacePrefs(page);
    await page.evaluate(() => {
      localStorage.removeItem('vishvakarma_local_projects');
      localStorage.removeItem('vishvakarma_local_draft');
    });
    await page.goto('/projects');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await shot(page, '03-projects-page.png');

    // 04. 2D Blueprint Editor
    await page.goto('/editor');
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
    await shot(page, '04-editor-2d-canvas.png');

    // 05. 3D Viewport
    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    if (await toggle3d.isVisible().catch(() => false)) {
      await toggle3d.click();
    }
    await expect(page.locator('.vish-3d-viewport-pane')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await shot(page, '05-editor-3d-viewport.png');

    // 06. Export Package Dialog
    await openExportDialog(page);
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await shot(page, '06-export-dialog.png');
    await page.keyboard.press('Escape');

    // 07. Lite Editor
    await page.goto('/editor-lite');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('lite-editor-page')).toBeVisible({ timeout: 30_000 });
    await shot(page, '07-editor-lite.png');

    // 08. Optimization Page
    await page.goto('/optimization');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/optimization|design battle/i).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, '08-optimization-page.png');

    // 09. Profile Page
    await page.goto('/profile');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '09-profile-page.png');

    // 10. Pricing Page
    await page.goto('/pricing');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /professional-grade tools/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '10-pricing-page.png');

    // 11. Features Page
    await page.goto('/features');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('tab', { name: /all features/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '11-features-page.png');

    // 12. Spec Center
    await page.goto('/spec-center');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /spec center/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '12-spec-center.png');

    // 13. Registry Page
    await page.goto('/registry');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /registry center/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '13-registry-page.png');

    // 14. Change Requests
    await page.goto('/change-requests');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: 'Change Requests', exact: true })).toBeVisible({ timeout: 30_000 });
    await shot(page, '14-change-requests.png');

    // 15. Releases Page
    await page.goto('/releases');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /release center/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '15-releases-page.png');

    // 16. World Records
    await page.goto('/world-records');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /world record registry/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '16-world-records.png');

    // 17. Audit Log
    await page.goto('/audit');
    await dismissConsentIfPresent(page);
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, '17-audit-log.png');

    // 18. Cast Viewer
    await page.goto('/cast/demo-token');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/joining\.\.\.|active lenses|follow presenter/i).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, '18-cast-viewer.png');

    // 19. 3D Room Showcase
    await page.goto('/3d-room');
    await dismissConsentIfPresent(page);
    await expect(page.getByText(/market-class 3d room|detached 3d chamber/i).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, '19-3d-room.png');
  });
});
