import { expect, test } from '@playwright/test';
import { dismissConsentIfPresent, dismissTutorialIfPresent, resetWorkspacePrefs } from './helpers';

/** Exact-SHA VISH UI in a real browser. No static mockups or fake screenshots. */
test.use({ video: 'on', screenshot: 'on' });

test('2D Focus makes the real editable canvas larger and restores full tools', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await resetWorkspacePrefs(page);
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
  await dismissTutorialIfPresent(page);
  await dismissConsentIfPresent(page);

  const toggle = page.getByTestId('editor-focus-2d-toggle');
  const stage = page.locator('.vish-canvas-stage');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary workspace navigation' })).toBeHidden();
  await expect(page.getByTestId('editor-sidebar-toggle')).toBeHidden();
  await expect(page.getByTestId('editor-topbar-save')).toBeVisible();
  await expect(page.locator('.vish-empty-guided-start')).toBeHidden();
  await expect(page.getByTestId('visual-theme-controller')).toBeHidden();
  await expect(page.locator('.vish-voice-tour-launch')).toBeHidden();
  await expect(page.getByTestId('tool-rail')).toBeVisible();
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  await expect(page.locator('.vish-3d-viewport-pane')).toHaveCount(0);
  const focused = await stage.boundingBox();
  if (!focused) throw new Error('2D drawing canvas is not displayed');
  await page.screenshot({ path: 'evidence/vish-focus-2d-desktop.png', fullPage: true });
  await info.attach('vish-focus-2d-desktop', { path: 'evidence/vish-focus-2d-desktop.png', contentType: 'image/png' });

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const nav = page.getByRole('navigation', { name: 'Primary workspace navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: /projects/i })).toBeVisible();
  const sidebar = page.getByTestId('editor-sidebar-toggle');
  await expect(sidebar).toBeVisible();
  await sidebar.click();
  await expect(sidebar).toHaveAttribute('aria-expanded', 'true');
  await sidebar.click();
  await expect(sidebar).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'More workspaces' }).click();
  await expect(page.getByRole('menuitem', { name: /registry/i })).toBeVisible();
  await page.keyboard.press('Escape');

  const save = page.getByTestId('editor-topbar-save');
  await expect(save).toBeVisible();
  expect((await save.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  const inspectorButton = page.getByRole('button', { name: 'Show properties inspector' });
  await expect(inspectorButton).toBeInViewport();
  await inspectorButton.click();
  await expect(page.getByRole('complementary', { name: 'Properties inspector' })).toBeVisible();
  const normal = await stage.boundingBox();
  if (!normal) throw new Error('Full workspace canvas is not displayed');
  expect(focused.width).toBeGreaterThan(normal.width + 190);
  expect(focused.height).toBeGreaterThan(normal.height + 45);
  console.log('VISH_FOCUS_CANVAS', JSON.stringify({
    focused: { width: focused.width, height: focused.height },
    normal: { width: normal.width, height: normal.height },
  }));
  await page.screenshot({ path: 'evidence/vish-full-workspace-desktop.png', fullPage: true });
  await info.attach('vish-full-workspace-desktop', { path: 'evidence/vish-full-workspace-desktop.png', contentType: 'image/png' });

  await toggle.click();
  await expect(page.getByRole('complementary', { name: 'Properties inspector' })).toHaveCount(0);
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  await page.keyboard.press('Shift+f');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
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
  await expect(page.getByTestId('editor-focus-2d-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('editor-focus-2d-toggle')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Toggle 3D view' })).toBeInViewport();
  const toolRail = page.getByTestId('tool-rail');
  await expect(toolRail).toBeVisible();
  const railBounds = await toolRail.boundingBox();
  expect(railBounds?.height).toBeLessThanOrEqual(90);
  await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  const stage = await page.locator('.vish-canvas-stage').boundingBox();
  expect(stage?.height ?? 0).toBeGreaterThan(340);
  expect(stage?.width ?? 0).toBeGreaterThan(250);
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 2);
  await page.screenshot({ path: 'evidence/vish-focus-2d-phone.png', fullPage: true });
  await info.attach('vish-focus-2d-phone', { path: 'evidence/vish-focus-2d-phone.png', contentType: 'image/png' });
});
