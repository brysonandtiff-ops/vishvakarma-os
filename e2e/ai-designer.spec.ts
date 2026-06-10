import { expect, test } from '@playwright/test';
import { dismissEditorOverlays, openAIDesigner, resetWorkspacePrefs } from './helpers';

test.describe('Architecture Copilot', () => {
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
    await page.route('**/api/ai/parse-site-documents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          council: {
            setbacks: { front: 6, side: 1.5, rear: 3 },
            maxCoverageRatio: 0.4,
            specialConditions: [],
          },
        }),
      });
    });
  });

  test('generates design via copilot wizard and loads walls in editor', async ({ page }) => {
    await openAIDesigner(page);
    await expect(page.getByRole('dialog')).toContainText('AI Architecture Copilot');
    await page.getByLabel('Design brief').fill('4-bedroom modern home on 600m² corner block with double garage');
    await page.getByRole('button', { name: 'Review inputs' }).click();
    await page.getByRole('button', { name: 'Generate design' }).click();
    await expect(page.getByRole('button', { name: 'Open in editor' })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole('button', { name: 'Why this plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Why this plan' }).click();
    await expect(page.getByTestId('plan-explanation')).toBeVisible();
    await expect(page.getByTestId('planning-shortlist')).toBeVisible();

    const runnerUpButton = page.getByRole('button', { name: 'Use this plan' }).first();
    if (await runnerUpButton.isVisible()) {
      await runnerUpButton.click();
      await expect(page.getByTestId('plan-explanation')).toContainText(/You selected plan-/);
    }

    await expect(page.getByRole('button', { name: 'Permit package' })).toBeVisible();
    await page.getByRole('button', { name: 'Open in editor' }).click();
    await expect(page.getByText(/Walls:\s*[1-9]/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
  });
});
