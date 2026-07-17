import { expect, test, type Page } from '@playwright/test';
import {
  dismissEditorOverlays,
  iPadLandscape,
  loadSampleProject,
  openProjectActionsMenu,
  resetWorkspacePrefs,
  saveProject,
} from './helpers';

async function settleProjects(page: Page) {
  await page.goto('/projects', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('projects-loading-skeleton')).toBeHidden({ timeout: 30_000 });
}

async function createNamedProject(page: Page, name: string) {
  await openProjectActionsMenu(page);
  const newProject = page.getByRole('menuitem', { name: /new project/i });
  await newProject.waitFor({ state: 'visible', timeout: 10_000 });
  await newProject.evaluate((element) => (element as HTMLElement).click());
  await expect(page.getByRole('dialog', { name: /create new project/i })).toBeVisible({ timeout: 15_000 });
  await page.getByLabel(/project name/i).fill(name);
  await page.getByRole('button', { name: /create project/i }).click({ force: true });
  await expect(page.getByRole('dialog', { name: /create new project/i })).toBeHidden({ timeout: 15_000 });
}

test.describe('projects and profile (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
  });

  test('/projects shows local mode guidance when cloud is unconfigured', async ({ page }) => {
    await settleProjects(page);
    await expect(page.getByText(/local draft mode/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /new in editor|open editor/i }).filter({ visible: true }).first()).toBeVisible();
  });

  test('new in editor CTA navigates to editor', async ({ page }) => {
    await settleProjects(page);
    await page.getByRole('link', { name: /new in editor/i }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
  });

  test('/profile shows backend mode and sign out redirects to auth', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/supabase.*local draft.*session/i).first()).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click({ force: true });
    await expect(page).toHaveURL(/\/auth$/, { timeout: 30_000 });
    await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  });

  test('named local project appears on projects after sample load', async ({ page }) => {
    await dismissEditorOverlays(page);
    await createNamedProject(page, 'E2E Draft');
    await loadSampleProject(page);
    await expect(page.getByText(/Walls:\s*4/i)).toBeVisible({ timeout: 20_000 });
    await saveProject(page);
    await expect(page.getByText(/project saved locally/i)).toBeVisible({ timeout: 20_000 });

    await settleProjects(page);
    await expect(page.getByRole('heading', { name: 'E2E Draft', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/4 walls/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
