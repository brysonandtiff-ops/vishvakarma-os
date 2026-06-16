import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  dismissConsentIfPresent,
  expect3DPreviewPane,
  openAIDesigner,
  openExportDialog,
  resetWorkspacePrefs,
} from './helpers';

const OUT_DIR = join(process.cwd(), 'docs/demo/screenshots');

function shot(page: import('@playwright/test').Page, name: string) {
  return page.screenshot({
    path: join(OUT_DIR, name),
    fullPage: false,
  });
}

async function mockCopilotApis(page: import('@playwright/test').Page) {
  await page.route('**/api/ai/extract-requirements', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'demo-capture',
        request: {
          style: 'modern Australian family home',
          bedrooms: 4,
          bathrooms: 2,
          garageSpaces: 2,
          levels: 1,
          parcel: { width: 24.5, depth: 24.5, area: 600, slope: 0, orientation: 'N' },
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
          specialConditions: ['Demo capture fixture only'],
        },
      }),
    });
  });
}

test.describe('2-minute demo flow screenshot pack', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures Landing → Projects → Editor → 2D/3D → Copilot proof → Export preview', async ({ page }) => {
    await resetWorkspacePrefs(page);
    await mockCopilotApis(page);

    await page.goto('/');
    await dismissConsentIfPresent(page);
    await expect(page.locator('body')).toContainText(/Vishvakarma\.OS|Sacred 3D View/i);
    await shot(page, '01-landing.png');

    await page.goto('/projects');
    await dismissConsentIfPresent(page);
    await expect(page.getByTestId('projects-empty-demo-samples')).toBeVisible({ timeout: 30_000 });
    await shot(page, '02-projects-demo-cards.png');

    await page.getByTestId('projects-open-demo-family-home-4br').click();
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
    await shot(page, '03-editor-2d-demo-blueprint.png');

    const toggle3d = page.getByRole('button', { name: /toggle 3d view/i });
    if (await toggle3d.isVisible().catch(() => false)) {
      await toggle3d.click();
    }
    await expect3DPreviewPane(page);
    await page.waitForTimeout(1000);
    await shot(page, '04-editor-3d-preview.png');

    await openAIDesigner(page);
    await expect(page.getByRole('dialog')).toContainText('AI Architecture Copilot');
    await page.getByLabel('Design brief').fill('4-bedroom modern home on 600m² corner block with double garage and family outdoor living');
    await page.getByRole('button', { name: 'Review inputs' }).click();
    await expect(page.getByText(/Target budget/i)).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/Target budget/i).fill('650000');
    await page.getByRole('button', { name: 'Generate design' }).click();
    await expect(page.getByTestId('copilot-proof-flow')).toBeVisible({ timeout: 90_000 });
    await shot(page, '05-ai-copilot-proof-flow.png');

    await page.getByRole('button', { name: 'Open in editor' }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });
    await openExportDialog(page);
    await expect(page.getByText(/Export Package|Export floor plan/i).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, '06-export-preview.png');
  });
});
