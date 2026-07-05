import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { dismissEditorOverlays, loadSampleProject, openProjectActionsMenu } from './helpers';

const ROOT = join(process.cwd(), 'docs/design/page-references');
const DIRS = {
  marketing: join(ROOT, 'marketing'),
  editor: join(ROOT, 'editor'),
  workspace: join(ROOT, 'workspace'),
  governance: join(ROOT, 'governance'),
} as const;

const LOCAL_DRAFT_KEY = 'vishvakarma.os.editor.localDraft.v1';
const ONBOARDING_DISMISSED_KEY = 'vishvakarma.os.onboardingDismissed.v1';

function shot(page: Page, dir: keyof typeof DIRS, name: string, fullPage = false) {
  return page.screenshot({
    path: join(DIRS[dir], name),
    fullPage,
  });
}

async function clearAppStorage(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

async function clickForce(page: Page, name: RegExp | string) {
  await page.getByRole('button', { name }).first().click({ force: true });
}

async function clickDom(page: Page, name: RegExp | string) {
  await page.getByRole('button', { name }).first().evaluate((el) => {
    (el as HTMLButtonElement).click();
  });
}

async function clickProjectActionsMenuItem(page: Page, name: RegExp | string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await openProjectActionsMenu(page);
      const item = page.getByRole('menuitem', { name }).first();
      await expect(item).toBeVisible({ timeout: 10_000 });
      await item.evaluate((el) => {
        (el as HTMLElement).click();
      });
      await page.waitForTimeout(250);
      return;
    } catch (error) {
      lastError = error;
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error(`Could not click Project actions menu item: ${String(name)}`);
}

async function dismissWorkspaceNotifications(page: Page) {
  const dismiss = page.getByRole('button', { name: /dismiss notification/i });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click({ force: true });
  }
}

async function loadSampleBlueprint(page: Page) {
  await dismissWorkspaceNotifications(page);

  const onboardingVisible = await page.getByTestId('first-run-welcome').isVisible().catch(() => false);
  if (onboardingVisible) {
    await clickDom(page, /load sample blueprint/i);
    await expect(page.getByRole('dialog', { name: /load sample blueprint/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /load blueprint/i }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await page.waitForFunction(
      () => {
        const bar = document.querySelector('.ws-status-bar');
        const text = bar?.textContent ?? '';
        const match = text.match(/Walls:\s*(\d+)/i);
        return Boolean(match && Number(match[1]) > 0);
      },
      { timeout: 30_000 },
    );
    return;
  }

  await loadSampleProject(page);
}

async function seedDraftRecovery(page: Page) {
  await page.evaluate(
    ({ key }) => {
      const payload = {
        version: 1,
        savedAt: new Date().toISOString(),
        projectId: null,
        projectName: 'Recovery Reference Draft',
        manifest: {
          version: '1.0.0',
          name: 'Recovery Reference Draft',
          walls: [
            {
              id: 'wall-ref-1',
              start: { x: 100, y: 100 },
              end: { x: 300, y: 100 },
              thickness: 12,
              height: 96,
              material: 'material-brick',
            },
          ],
          openings: [],
          materials: [],
          floorMaterial: 'material-concrete',
          lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
          gridSize: 20,
          snapToGrid: true,
          metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
        },
      };
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.removeItem('vishvakarma.os.onboardingDismissed.v1');
    },
    { key: LOCAL_DRAFT_KEY },
  );
}

async function prepareEditorWithSample(page: Page) {
  await clearAppStorage(page);
  await page.evaluate(
    (key) => localStorage.setItem(key, '1'),
    ONBOARDING_DISMISSED_KEY,
  );
  await dismissEditorOverlays(page);
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
  await loadSampleBlueprint(page);
  await page.waitForTimeout(2500);
}

test.describe('page reference pack', () => {
  test.setTimeout(420_000);

  test.beforeAll(() => {
    for (const dir of Object.values(DIRS)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  test('captures full visual inventory', async ({ page }) => {
    // ── Marketing ──────────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await shot(page, 'marketing', '01-landing.png', true);

    await page.goto('/features');
    await expect(page.getByRole('tab', { name: 'Getting Started' })).toBeVisible();
    await shot(page, 'marketing', '02-features-guides.png', true);

    await page.getByRole('tab', { name: /all features/i }).click();
    await expect(page.getByTestId('features-panel-all')).toBeVisible();
    await expect(page.getByText(/^Available$/i).first()).toBeVisible();
    await shot(page, 'marketing', '03-features-all.png', true);

    await page.goto('/auth');
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });
    await shot(page, 'marketing', '04-auth.png', true);

    await page.goto('/reset-password');
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByTestId('auth-page')).toBeVisible();
    await expect(page.getByTestId('google-sso-button')).toContainText(/continue with google sso/i);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await shot(page, 'marketing', '05-auth-reset-notice.png', true);

    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText(/route not found/i)).toBeVisible();
    await shot(page, 'marketing', '06-not-found.png', true);

    await page.goto('/pricing');
    await expect(page.getByText(/Professional-grade tools/i)).toBeVisible();
    await shot(page, 'marketing', '07-pricing.png', true);

    // ── Editor: welcome + empty ────────────────────────────────────────────
    await clearAppStorage(page);
    await page.goto('/editor');
    await expect(page.getByText(/Welcome to Vishvakarma\.OS/i)).toBeVisible({ timeout: 30_000 });
    await shot(page, 'editor', '08-welcome-overlay.png');

    await page.evaluate(
      (key) => localStorage.setItem(key, '1'),
      ONBOARDING_DISMISSED_KEY,
    );
    await page.goto('/editor');
    await dismissWorkspaceNotifications(page);
    const recoveryDiscard = page.getByRole('button', { name: /discard draft/i });
    if (await recoveryDiscard.isVisible().catch(() => false)) {
      await recoveryDiscard.click({ force: true });
    }
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await shot(page, 'editor', '09-empty-2d.png');

    // ── Editor: sample + 3D modes ────────────────────────────────────────
    await loadSampleBlueprint(page);
    await shot(page, 'editor', '10-2d-sample.png');

    await clickForce(page, /toggle 3d view/i);
    await page.waitForTimeout(1500);
    await shot(page, 'editor', '11-3d-premium.png');

    await clickForce(page, 'Standard');
    await page.waitForTimeout(1500);
    await shot(page, 'editor', '12-3d-standard.png');

    await clickForce(page, 'Cinematic');
    await page.waitForTimeout(1500);
    await shot(page, 'editor', '13-3d-cinematic.png');

    // ── Editor: dialogs ────────────────────────────────────────────────────
    await clickProjectActionsMenuItem(page, /^export$/i);
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await shot(page, 'editor', '14-export-dialog.png');
    await page.keyboard.press('Escape');

    await clickProjectActionsMenuItem(page, /new project/i);
    await expect(page.getByRole('heading', { name: /create new project/i })).toBeVisible();
    await shot(page, 'editor', '15-new-project-dialog.png');
    await page.keyboard.press('Escape');

    await clickProjectActionsMenuItem(page, /^open/i);
    await expect(page.getByRole('heading', { name: /open project/i })).toBeVisible();
    await shot(page, 'editor', '16-open-project-dialog.png');
    await page.keyboard.press('Escape');

    await clickForce(page, /import floor plan/i);
    await expect(page.getByRole('heading', { name: /import floor plan/i })).toBeVisible();
    await shot(page, 'editor', '17-import-dialog.png');
    await page.keyboard.press('Escape');

    await page.waitForTimeout(2000);
    await expect(page.getByText(/Local Draft/i).first()).toBeVisible();
    await shot(page, 'editor', '19-local-draft-badge.png');

    // ── Editor: draft recovery (fresh context) ─────────────────────────────
    await seedDraftRecovery(page);
    await page.goto('/editor');
    await expect(page.getByRole('heading', { name: /recover local draft/i })).toBeVisible({ timeout: 30_000 });
    await shot(page, 'editor', '18-draft-recovery.png');
    await page.getByRole('button', { name: /discard draft/i }).click();

    // ── Workspace ──────────────────────────────────────────────────────────
    await clearAppStorage(page);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await shot(page, 'workspace', '20-projects-empty.png');

    await prepareEditorWithSample(page);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible({ timeout: 15_000 });
    const populatedStats = page.getByText(/walls\s*[·•]\s*.*openings/i).first();
    if (!(await populatedStats.isVisible({ timeout: 5_000 }).catch(() => false))) {
      await expect(page.getByTestId('projects-empty-demo-samples')).toBeVisible({ timeout: 15_000 });
    }
    await shot(page, 'workspace', '21-projects-populated.png');

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    await shot(page, 'workspace', '22-profile.png');

    // ── Governance ─────────────────────────────────────────────────────────
    await page.goto('/spec-center');
    await expect(page.getByRole('heading', { name: /spec center/i }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('governance-backend-banner')).toBeVisible();
    await shot(page, 'governance', '23-spec-center.png');

    await page.getByRole('button', { name: /view full spec/i }).click();
    await expect(page.getByRole('heading', { name: /blueprint editor/i })).toBeVisible();
    await shot(page, 'governance', '24-spec-new-dialog.png');
    await page.keyboard.press('Escape');

    await page.goto('/registry');
    await expect(page.getByRole('heading', { name: /registry center/i }).first()).toBeVisible();
    await shot(page, 'governance', '25-registry.png');

    await page.goto('/change-requests');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /change request/i }).first()).toBeVisible();
    await shot(page, 'governance', '27-change-requests.png');

    await page.goto('/releases');
    await expect(page.getByRole('heading', { name: /release center/i }).first()).toBeVisible();
    await shot(page, 'governance', '29-releases.png');

    await page.goto('/world-records');
    await expect(page.getByRole('heading', { name: /world record registry/i }).first()).toBeVisible();
    await shot(page, 'governance', '30-world-records.png');

    await page.goto('/optimization');
    await dismissWorkspaceNotifications(page);
    await expect(page.getByRole('heading', { name: /design battle/i }).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, 'governance', '32-optimization.png');

    await page.goto('/audit');
    await expect(page.getByRole('heading', { name: /audit log/i }).first()).toBeVisible();
    await shot(page, 'governance', '31-audit.png');
  });
});
