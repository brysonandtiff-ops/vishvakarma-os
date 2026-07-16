import { expect, test, type Page } from '@playwright/test';
import { openProjectActionsMenu } from './helpers';

async function seedSettledUi(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
  });
}

async function expectVisibleSurfacesInsideViewport(page: Page) {
  await page.waitForTimeout(120);
  const surfaces = page.locator('[role="menu"]:visible, [role="dialog"]:visible, [role="listbox"]:visible');
  const count = await surfaces.count();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;

  for (let index = 0; index < count; index += 1) {
    const surface = surfaces.nth(index);
    const box = await surface.boundingBox();
    if (!box) continue;
    expect(box.width, 'Visible menu/dialog must have measurable width').toBeGreaterThan(0);
    expect(box.height, 'Visible menu/dialog must have measurable height').toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(-2);
    expect(box.y).toBeGreaterThanOrEqual(-2);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2);
  }

  const blockingCount = await page.locator('[aria-modal="true"]:visible').count();
  expect(blockingCount, `Stacked blocking surfaces: ${blockingCount}`).toBeLessThanOrEqual(1);
}

test.describe('Menu and overlay collision audit', () => {
  test('mobile marketing menu remains in bounds', async ({ page }) => {
    await seedSettledUi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /draw floor plans.*review in 3d.*export proof/i })).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: /open menu/i }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expectVisibleSurfacesInsideViewport(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('project actions menu remains in bounds on iPad landscape', async ({ page }) => {
    await seedSettledUi(page);
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });

    await openProjectActionsMenu(page);
    await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 10_000 });
    await expectVisibleSurfacesInsideViewport(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem').first()).toBeHidden();
  });

  test('workspace navigation does not stack over another blocking dialog', async ({ page }) => {
    await seedSettledUi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: /open workspace navigation/i }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expectVisibleSurfacesInsideViewport(page);
  });
});
