import { expect, test } from '@playwright/test';
import { dismissConsentIfPresent, openExportDialog, resetWorkspacePrefs } from './helpers';

test.describe('Compliance gate', () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    });
  });

  test('shows banner and blocks export when setback rule fails', async ({ page }) => {
    await page.addInitScript(async () => {
      const res = await fetch('/samples/compliance-setback-fail.json');
      const manifest = await res.json();
      window.localStorage.setItem(
        'vishvakarma.os.editor.localDraft.v1',
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          projectId: null,
          projectName: manifest.name,
          manifest,
        })
      );
    });

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
    await dismissConsentIfPresent(page);

    const restoreDraft = page.getByRole('button', { name: /restore draft/i });
    await expect(restoreDraft).toBeVisible({ timeout: 15_000 });
    await restoreDraft.click();

    await expect(page.getByTestId('compliance-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('compliance-banner')).toContainText(/export blocked/i);
    await expect(page.getByTestId('compliance-banner')).toContainText(/setback/i);

    await openExportDialog(page);
    await expect(page.getByTestId('export-blocked-message')).toBeVisible();
    await expect(page.getByTestId('export-json-button')).toBeDisabled();
  });
});
