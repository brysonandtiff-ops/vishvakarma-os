import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, resetWorkspacePrefs } from './helpers';

test.describe('AI Building Designer', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
    await dismissEditorOverlays(page);
    await page.route('**/api/ai/extract-requirements', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'fallback',
          request: {
            style: 'modern',
            bedrooms: 4,
            bathrooms: 2,
            garageSpaces: 2,
            levels: 1,
            parcel: { width: 24.5, depth: 24.5, area: 600, slope: 0, orientation: 'corner', cornerLot: true },
          },
        }),
      });
    });
  });

  test('generates design and loads walls in editor', async ({ page }) => {
    await page.getByTestId('editor-ai-designer').click();
    await expect(page.getByRole('dialog')).toContainText('Design with AI');
    await page.getByLabel('Design brief').fill('4-bedroom modern home on 600m² corner block with double garage');
    await page.getByRole('button', { name: 'Generate design' }).click();
    await expect(page.getByRole('button', { name: 'Open in editor' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Open in editor' }).click();
    await expect(page.getByText(/Walls:\s*[1-9]/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  });
});
