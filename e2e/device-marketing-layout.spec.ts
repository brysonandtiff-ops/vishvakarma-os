import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  iPadPortrait,
  iPhonePortrait,
} from './helpers';

const MARKETING_TOUCH_SELECTORS = [
  '.vish-marketing-nav-menu-btn',
  '.vish-marketing-hero .touch-target',
  '.vish-marketing-hero a[href="/auth"], .vish-marketing-hero a[href="/editor"]',
  '.vish-features-toggle button',
  '.vish-features-toggle [role="tab"]',
  '.vish-pricing-faq button',
  '.vish-pricing-card .touch-target',
];

async function assertMarketingPage(
  page: import('@playwright/test').Page,
  path: string,
  heading: string | RegExp,
) {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 30_000 });
  await assertNoHorizontalOverflow(page);
  await assertTouchTargets(page, MARKETING_TOUCH_SELECTORS);
}

test.describe('Device marketing layout', () => {
  test('landing page fits iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await assertMarketingPage(page, '/', /architecture studio/i);
  });

  test('landing page fits iPhone portrait', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await assertMarketingPage(page, '/', /architecture studio/i);
  });

  test('features page fits iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await assertMarketingPage(page, '/features', /interactive guides/i);
  });

  test('features page fits iPhone portrait', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await assertMarketingPage(page, '/features', /interactive guides/i);
  });

  test('pricing page fits iPad portrait when enabled', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/pricing');
    const pricingHeading = page.getByRole('heading', { name: /professional-grade tools/i });
    const notFound = page.getByRole('heading', { name: /404|not found|route not found/i });
    if (await pricingHeading.isVisible().catch(() => false)) {
      await assertNoHorizontalOverflow(page);
      await assertTouchTargets(page, MARKETING_TOUCH_SELECTORS);
    } else if (await notFound.isVisible().catch(() => false)) {
      test.skip(true, 'Pricing page disabled in this build');
    } else {
      await expect(pricingHeading).toBeVisible({ timeout: 10_000 });
    }
  });
});
