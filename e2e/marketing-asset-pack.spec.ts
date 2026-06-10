import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { loadSampleProject, openProjectActionsMenu } from './helpers';

const OUT_DIR = join(process.cwd(), 'public/marketing');

async function dismissWelcome(page: import('@playwright/test').Page) {
  const dismiss = page.getByRole('button', { name: /close|dismiss|got it|skip/i });
  if (await dismiss.first().isVisible().catch(() => false)) {
    await dismiss.first().click();
  }
}

test.describe('marketing asset pack', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures product screenshots for landing page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/editor');
    await dismissWelcome(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    await page.getByTestId('blueprint-canvas').screenshot({ path: join(OUT_DIR, 'product-2d.png') });

    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await page.waitForTimeout(1500);

    await page.locator('.bg-ws-canvas').first().screenshot({ path: join(OUT_DIR, 'product-3d.png') });

    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /^export$/i }).click();
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await page.getByRole('dialog').screenshot({ path: join(OUT_DIR, 'product-export.png') });
    await page.keyboard.press('Escape');
  });
});
