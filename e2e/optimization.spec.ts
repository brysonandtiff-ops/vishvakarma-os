import { expect, test } from '@playwright/test';
import { resetWorkspacePrefs } from './helpers';

test.describe('Design Optimization', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
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

  test('generates and displays 5 optimization candidates with explainability UI', async ({ page }) => {
    await page.goto('/optimization');
    await page.getByTestId('constraint-prompt').fill('4-bedroom modern home on 600m² corner block');
    await page.getByTestId('constraint-budget').fill('450000');
    await page.getByTestId('constraint-regenerate').click();

    await expect(page.getByTestId('optimization-loading')).toBeVisible();
    await expect(page.getByTestId('system-flow-hud')).toBeVisible();
    await expect(page.getByTestId('compute-overlay')).toBeVisible();
    await expect(page.getByTestId('candidate-grid')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('candidate-card-candidate-a')).toBeVisible();
    await expect(page.getByTestId('optimization-dashboard')).toBeVisible();
    await expect(page.getByTestId('decision-explainer')).toBeVisible();
    await expect(page.getByTestId('cost-intelligence-panel')).toBeVisible();
    await expect(page.getByTestId('moat-gain-panel')).toBeVisible();
    await expect(page.getByTestId('winner-hero-panel')).toBeVisible();
    await expect(page.getByTestId('tradeoff-delta-chart')).toBeVisible();
    await expect(page.getByTestId('score-breakdown')).toBeVisible();
  });

  test('regenerates after constraint edit', async ({ page }) => {
    await page.goto('/optimization');
    await page.getByTestId('constraint-prompt').fill('4-bedroom modern home on 600m² corner block');
    await page.getByTestId('constraint-regenerate').click();
    await expect(page.getByTestId('optimization-dashboard')).toBeVisible({ timeout: 90_000 });

    await page.getByTestId('constraint-budget').fill('500000');
    await expect(page.getByTestId('constraints-dirty')).toBeVisible();
    await page.getByTestId('constraint-regenerate').click();

    await expect(page.getByTestId('optimization-loading')).toBeVisible();
    await expect(page.getByTestId('optimization-dashboard')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('decision-explainer')).toBeVisible();
  });
});
