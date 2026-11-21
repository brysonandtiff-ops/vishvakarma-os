import { expect, test } from '@playwright/test';
import { dismissConsentIfPresent, dismissTutorialIfPresent, resetWorkspacePrefs } from './helpers';

/** Exact-SHA VISH UI in a real browser. No static mockups or fake screenshots. */
test.use({ video: 'on', screenshot: 'on' });

test('desktop work area is focused and accessible', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await resetWorkspacePrefs(page);
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60000 });
  await dismissTutorialIfPresent(page);
  await dismissConsentIfPresent(page);

  const sidebar = page.getByTestId('editor-sidebar-toggle');
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveAttribute('aria-expanded', 'false');
  await sidebar.click();
  await expect(sidebar).toHaveAttribute('aria-expanded', 'true');
  await sidebar.click();
  await expect(sidebar).toHaveAttribute('aria-expanded', 'false');

  const nav = page.getByRole('navigation', { name: 'Primary workspace navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: /blueprint editor/i })).toBeVisible();
  await expect(nav.getByRole('link', { name: /projects/i })).toBeVisible();
  await page.getByRole('button', { name: 'More workspaces' }).click();
  await expect(page.getByRole('menuitem', { name: /registry/i })).toBeVisible();
  await page.keyboard.press('Escape');

  const save = page.getByTestId('editor-topbar-save');
  await expect(save).toBeVisible();
  const bounds = await save.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Toggle 3D view' }).click({ force: true });
  await expect(page.getByRole('button', { name: 'Show properties inspector' })).toBeVisible();
  await page.getByRole('button', { name: 'Show properties inspector' }).click();
  await expect(page.getByRole('complementary', { name: 'Properties inspector' })).toBeVisible();
  await page.getByRole('button', { name: 'Hide properties inspector' }).click();
  await expect(page.getByRole('complementary', { name: 'Properties inspector' })).toHaveCount(0);
  await page.screenshot({ path: 'evidence/vish-ui-desktop.png', fullPage: true });
  await info.attach('vish-ui-desktop', { path: 'evidence/vish-ui-desktop.png', contentType: 'image/png' });
});

test('phone layout keeps primary actions available without page overflow', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetWorkspacePrefs(page);
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60000 });
  await dismissTutorialIfPresent(page);
  await dismissConsentIfPresent(page);
  await expect(page.getByTestId('editor-topbar-save')).toBeVisible();
  await expect(page.getByTestId('editor-topbar-save')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Toggle 3D view' })).toBeInViewport();
  const toolRail = page.getByTestId('tool-rail');
  await expect(toolRail).toBeVisible();
  const railBounds = await toolRail.boundingBox();
  expect(railBounds?.height).toBeLessThanOrEqual(90);
  await expect(page.getByRole('button', { name: 'Open workspace navigation' })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 2);
  await page.screenshot({ path: 'evidence/vish-ui-phone.png', fullPage: true });
  await info.attach('vish-ui-phone', { path: 'evidence/vish-ui-phone.png', contentType: 'image/png' });
});
