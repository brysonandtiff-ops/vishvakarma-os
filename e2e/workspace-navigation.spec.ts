import { expect, test, type Page } from '@playwright/test';
import { iPadLandscape, resetWorkspacePrefs } from './helpers';

const sidebarLinks = [
  { name: 'Studio', path: '/editor', testId: 'editor-top-bar' },
  { name: 'Projects', path: '/projects', heading: /^projects$/i },
  { name: 'Profile', path: '/profile', heading: /^profile$/i },
  { name: 'Spec Center', path: '/spec-center', heading: /spec center/i },
  { name: 'Registry Center', path: '/registry', heading: /registry center/i },
  { name: 'Change Requests', path: '/change-requests', heading: /change request/i },
  { name: 'Release Center', path: '/releases', heading: /release center/i },
  { name: 'World Records', path: '/world-records', heading: /world record registry/i },
  { name: 'Audit Log', path: '/audit', heading: /audit log/i },
] as const;

async function openWorkspaceShell(page: Page) {
  await page.goto('/projects', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /^projects$/i })).toBeVisible({ timeout: 30_000 });
}

async function openWorkspaceMenu(page: Page) {
  await page.getByRole('button', { name: 'Open workspace navigation' }).click();
  return page.getByRole('dialog', { name: 'Workspace' });
}

test.describe('workspace navigation (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
  });

  for (const link of sidebarLinks) {
    test(`workspace menu link "${link.name}" reaches ${link.path}`, async ({ page }) => {
      await openWorkspaceShell(page);
      const menu = await openWorkspaceMenu(page);
      const target = menu.getByRole('link', { name: link.name, exact: true });
      await expect(target).toBeVisible({ timeout: 15_000 });
      await target.click({ force: true });
      await expect(page).toHaveURL(new RegExp(`${link.path.replace('/', '\\/')}$`), { timeout: 30_000 });

      if ('testId' in link && link.testId) {
        await expect(page.getByTestId(link.testId)).toBeVisible({ timeout: 60_000 });
      } else if ('heading' in link && link.heading) {
        await expect(page.getByRole('heading', { name: link.heading }).first()).toBeVisible({ timeout: 30_000 });
      }
    });
  }

  test('command palette jumps to profile and spec center', async ({ page }) => {
    await openWorkspaceShell(page);

    const openPalette = async () => {
      const trigger = page.getByRole('button', { name: /open command palette/i }).filter({ visible: true }).first();
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click({ force: true });
      const input = page.getByPlaceholder('Search routes, tools, tutorials…');
      await expect(input).toBeVisible({ timeout: 15_000 });
      return input;
    };

    const paletteInput = await openPalette();
    await paletteInput.fill('Profile');
    await page.getByRole('option', { name: /profile/i }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible({ timeout: 30_000 });

    const paletteInputAgain = await openPalette();
    await paletteInputAgain.fill('Spec Center');
    await page.getByRole('option', { name: /spec center/i }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/spec-center$/);
    await expect(page.getByRole('heading', { name: /spec center/i }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('mobile sheet drawer navigates to spec center', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openWorkspaceShell(page);
    const menu = await openWorkspaceMenu(page);
    const specCenter = menu.getByRole('link', { name: 'Spec Center', exact: true });
    await expect(specCenter).toBeVisible({ timeout: 15_000 });
    await specCenter.click({ force: true });
    await expect(page).toHaveURL(/\/spec-center$/);
    await expect(page.getByRole('heading', { name: /spec center/i }).first()).toBeVisible({ timeout: 30_000 });
  });
});
