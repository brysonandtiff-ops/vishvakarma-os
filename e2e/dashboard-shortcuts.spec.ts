import { expect, test } from '@playwright/test';

const shortcuts = [
  { buttonId: 'dashboard-open-project', dialogName: 'Open Project' },
  { buttonId: 'dashboard-import-files', dialogName: 'Import Floor Plan' },
  { buttonId: 'dashboard-ai-copilot', dialogName: 'AI Architecture Copilot' },
] as const;

test.describe('dashboard shortcuts open real editor dialogs (local test project)', () => {
  for (const { buttonId, dialogName } of shortcuts) {
    test(`${buttonId} navigates and opens ${dialogName}`, async ({ page }) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded' });

      const shortcut = page.getByTestId(buttonId);
      await expect(shortcut).toBeVisible({ timeout: 30_000 });
      await shortcut.click();

      await expect(page).toHaveURL(/\/editor$/, { timeout: 30_000 });
      await expect(page.getByRole('dialog', { name: dialogName, exact: true }))
        .toBeVisible({ timeout: 60_000 });
    });
  }
});
