import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const OUT_DIR = join(process.cwd(), 'docs/release/evidence/screenshots');

function shot(page: import('@playwright/test').Page, name: string) {
  return page.screenshot({
    path: join(OUT_DIR, name),
    fullPage: false,
  });
}

async function dismissWelcome(page: import('@playwright/test').Page) {
  const dismiss = page.getByRole('button', { name: /close|dismiss|got it|skip/i });
  if (await dismiss.first().isVisible().catch(() => false)) {
    await dismiss.first().click();
  }
}

  test.describe('release screenshot pack', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('captures marketing and editor screenshots', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await shot(page, '01-landing-hero.png');

    await page.goto('/auth');
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible();
    await shot(page, '02-auth-email-link.png');

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/editor');
    await dismissWelcome(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /sample/i }).click();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
    await shot(page, '03-editor-2d-sample.png');

    await page.getByRole('button', { name: /toggle 3d view/i }).click();
    await page.waitForTimeout(1500);
    await shot(page, '04-editor-3d-premium.png');

    await page.getByRole('button', { name: /export floor plan/i }).click();
    await expect(page.getByText(/Export Package/i)).toBeVisible();
    await shot(page, '05-export-package-dialog.png');
    await page.keyboard.press('Escape');

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible();
    await shot(page, '06-projects-empty.png');

    await page.goto('/features');
    await page.getByRole('button', { name: /all features/i }).click();
    await expect(page.getByText(/Available now in editor/i).first()).toBeVisible();
    await shot(page, '07-features-ready-badges.png');
  });
});
