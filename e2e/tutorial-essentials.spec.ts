import { test, expect } from '@playwright/test';
import {
  dismissConsentIfPresent,
  dismissEditorOverlays,
  dismissTutorialIfPresent,
  gotoAppPath,
  resetWorkspacePrefs,
} from './helpers';

test.describe('Tutorial essentials', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissConsentIfPresent(page);
  });

  test('starts essentials tour from help button and gates wall tool step', async ({ page }) => {
    await gotoAppPath(page, '/editor');
    await dismissEditorOverlays(page);

    await page.getByRole('button', { name: /open tutorials/i }).click();
    await expect(page.getByTestId('tutorial-hub')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('tutorial-hub-track-essentials').getByRole('button', { name: /^start$/i }).click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('tutorial-card')).toContainText(/Welcome to Vishvakarma/i);

    await page.getByTestId('tutorial-continue').click();
    await page.getByTestId('tutorial-continue').click();

    const continueBtn = page.getByTestId('tutorial-continue');
    await expect(continueBtn).toContainText(/Wall/i);
    await expect(continueBtn).toBeDisabled();

    await page.locator('[data-tutorial="tool-wall"]').click();
    await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('dismisses tutorial overlay from skip control', async ({ page }) => {
    await gotoAppPath(page, '/editor');
    await dismissEditorOverlays(page);

    await page.getByRole('button', { name: /open tutorials/i }).click();
    await page.getByTestId('tutorial-hub-track-essentials').getByRole('button', { name: /^start$/i }).click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    await page.locator('[data-testid="tutorial-card"] button[aria-label="Skip tutorial"]').click();
    await dismissTutorialIfPresent(page);
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
  });
});
