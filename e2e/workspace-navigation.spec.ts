import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, iPadLandscape } from './helpers';

const sidebarLinks = [
  { name: 'Blueprint Editor', path: '/editor', heading: /editor|blueprint/i },
  { name: 'Projects', path: '/projects', heading: /your projects/i },
  { name: 'Profile', path: '/profile', heading: /account/i },
  { name: 'Spec Center', path: '/spec-center', heading: /spec center/i },
  { name: 'Registry', path: '/registry', heading: /registry center/i },
  { name: 'Change Requests', path: '/change-requests', heading: /change request/i },
  { name: 'Release Center', path: '/releases', heading: /release center/i },
  { name: 'World Records', path: '/world-records', heading: /world record registry/i },
  { name: 'Audit Log', path: '/audit', heading: /audit log/i },
];

test.describe('workspace navigation (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });

  test.beforeEach(async ({ page }) => {
    await dismissEditorOverlays(page);
  });

  for (const link of sidebarLinks) {
    test(`sidebar link "${link.name}" reaches ${link.path}`, async ({ page }) => {
      await page.goto('/editor');
      await page.getByRole('link', { name: link.name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${link.path.replace('/', '\\/')}$`));
      await expect(page.getByRole('heading', { name: link.heading }).first()).toBeVisible({ timeout: 30_000 });
    });
  }

  test('mobile sheet drawer navigates to projects', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor');
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
  });

  test('command palette jumps to profile and spec center', async ({ page }) => {
    await page.goto('/editor');
    await page.getByRole('button', { name: /open command palette/i }).click();
    await page.getByPlaceholder(/jump to a workspace/i).fill('Profile');
    await page.getByRole('option', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByRole('button', { name: /open command palette/i }).click();
    await page.getByPlaceholder(/jump to a workspace/i).fill('Spec Center');
    await page.getByRole('option', { name: /spec center/i }).click();
    await expect(page).toHaveURL(/\/spec-center$/);
  });
});
