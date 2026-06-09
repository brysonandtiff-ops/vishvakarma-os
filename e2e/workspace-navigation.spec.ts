import { expect, test } from '@playwright/test';
import {
  dismissEditorOverlays,
  expandSidebarIfCollapsed,
  gotoWorkspaceShell,
  iPadLandscape,
  resetWorkspacePrefs,
} from './helpers';

const sidebarLinks = [
  { name: 'Blueprint Editor', path: '/editor', testId: 'editor-top-bar' },
  { name: 'Projects', path: '/projects', heading: /your projects/i },
  { name: 'Profile', path: '/profile', heading: /profile/i },
  { name: 'Spec Center', path: '/spec-center', heading: /spec center/i },
  { name: 'Registry', path: '/registry', heading: /registry center/i },
  { name: 'Change Requests', path: '/change-requests', heading: /change request/i },
  { name: 'Release Center', path: '/releases', heading: /release center/i },
  { name: 'World Records', path: '/world-records', heading: /world record registry/i },
  { name: 'Audit Log', path: '/audit', heading: /audit log/i },
];

test.describe('workspace navigation (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
  });

  for (const link of sidebarLinks) {
    test(`sidebar link "${link.name}" reaches ${link.path}`, async ({ page }) => {
      await gotoWorkspaceShell(page, '/projects');
      await expandSidebarIfCollapsed(page);
      await page.getByRole('link', { name: link.name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${link.path.replace('/', '\\/')}$`));

      if ('testId' in link && link.testId) {
        await expect(page.getByTestId(link.testId)).toBeVisible({ timeout: 60_000 });
      } else if ('heading' in link && link.heading) {
        await expect(page.getByRole('heading', { name: link.heading }).first()).toBeVisible({ timeout: 60_000 });
      }
    });
  }

  test('command palette jumps to profile and spec center', async ({ page }) => {
    await gotoWorkspaceShell(page, '/projects');

    const openPalette = async () => {
      await page.keyboard.press('Control+K');
      const input = page.getByPlaceholder(/jump to a workspace/i);
      await expect(input).toBeVisible({ timeout: 15_000 });
      return input;
    };

    const paletteInput = await openPalette();
    await paletteInput.fill('Profile');
    await page.getByRole('option', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile$/);

    const paletteInputAgain = await openPalette();
    await paletteInputAgain.fill('Spec Center');
    await page.getByRole('option', { name: /spec center/i }).click();
    await expect(page).toHaveURL(/\/spec-center$/);
  });

  test('mobile sheet drawer navigates to spec center', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoWorkspaceShell(page, '/projects');
    const declineAnalytics = page.getByRole('button', { name: /decline/i });
    if (await declineAnalytics.isVisible().catch(() => false)) {
      await declineAnalytics.click();
    }
    await page.getByRole('button', { name: /open navigation/i }).click({ force: true });
    await page.getByRole('link', { name: 'Spec Center', exact: true }).click();
    await expect(page).toHaveURL(/\/spec-center$/);
    await expect(page.getByRole('heading', { name: /spec center/i }).first()).toBeVisible({ timeout: 30_000 });
  });
});
