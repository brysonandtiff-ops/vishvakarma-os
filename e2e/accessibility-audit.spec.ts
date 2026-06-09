import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { dismissEditorOverlays } from './helpers';

const CRITICAL_RULES = ['color-contrast', 'document-title', 'html-has-lang', 'image-alt', 'label'];

test.describe('accessibility audit (WCAG 2.1 AA scan)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('vishvakarma-analytics-consent', 'false');
    });
  });

  async function dismissAnalyticsBanner(page: import('@playwright/test').Page) {
    const decline = page.getByRole('button', { name: /decline/i });
    if (await decline.isVisible().catch(() => false)) {
      await decline.click();
    }
  }

  async function expectNoCriticalViolations(page: import('@playwright/test').Page, label: string) {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => CRITICAL_RULES.includes(v.id));
    if (critical.length > 0) {
      const summary = critical.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n');
      throw new Error(`[${label}] critical a11y violations:\n${summary}`);
    }

    expect(results.violations.length).toBeLessThanOrEqual(5);
  }

  test('landing page', async ({ page }) => {
    await page.goto('/');
    await dismissAnalyticsBanner(page);
    await expect(page.getByText(/Sacred 3D View/i).first()).toBeVisible();
    await expectNoCriticalViolations(page, 'landing');
  });

  test('features page', async ({ page }) => {
    await page.goto('/features');
    await dismissAnalyticsBanner(page);
    await expect(page.getByRole('button', { name: 'Interactive Guides' })).toBeVisible();
    await expectNoCriticalViolations(page, 'features');
  });

  test('editor workspace', async ({ page }) => {
    await dismissEditorOverlays(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible();
    await expectNoCriticalViolations(page, 'editor');
  });
});
