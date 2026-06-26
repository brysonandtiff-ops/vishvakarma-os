import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  iPadLandscape,
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

  test('landing page fits iPad landscape', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await assertMarketingPage(page, '/', /architecture studio/i);
  });

  test('landing page fits iPhone portrait', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await assertMarketingPage(page, '/', /architecture studio/i);
  });

  test('features page fits iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await assertMarketingPage(page, '/features', /interactive guides|full feature reference/i);
  });

  test('features page fits iPad landscape', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await assertMarketingPage(page, '/features', /interactive guides|full feature reference/i);
  });

  test('features page fits iPhone portrait', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await assertMarketingPage(page, '/features', /interactive guides|full feature reference/i);
  });

  test('pricing page fits iPad portrait when enabled', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/pricing');

    const pricingHeading = page.getByRole('heading', {
      name: /professional-grade tools|fair, predictable pricing/i,
    });
    const notFound = page.getByRole('heading', { name: /404|not found|route not found/i });

    const pricingVisible = await pricingHeading
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    if (pricingVisible) {
      await assertNoHorizontalOverflow(page);
      await assertTouchTargets(page, MARKETING_TOUCH_SELECTORS);
      return;
    }

    const routeMissing = await notFound
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (routeMissing) {
      test.skip(true, 'Pricing page disabled in this build');
      return;
    }

    await expect(pricingHeading.first()).toBeVisible({ timeout: 10_000 });
  });
});
