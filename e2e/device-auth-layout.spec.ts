import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  iPadLandscape,
  iPadPortrait,
} from './helpers';

const AUTH_TOUCH_SELECTORS = [
  '[data-testid="auth-mockup-card"] .vish-login-page__primary',
  '[data-testid="auth-mockup-card"] .vish-login-page__link',
  '.vish-auth-google-button',
];

async function assertAuthPageLayout(page: import('@playwright/test').Page) {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('google-sso-button')).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await assertTouchTargets(page, AUTH_TOUCH_SELECTORS);
}

test.describe('Device auth layout', () => {
  test('auth page fits iPad portrait without overflow', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await assertAuthPageLayout(page);
  });

  test('auth page fits iPad landscape without overflow', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await assertAuthPageLayout(page);
    await expect(page.getByTestId('auth-trust-pillars')).toBeHidden();
  });

  test('Google SSO action stays reachable in reduced-height iPad viewport', async ({ page }) => {
    const reducedViewport = { width: iPadPortrait.width, height: 520 };
    await page.setViewportSize(reducedViewport);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });

    const submit = page.getByTestId('google-sso-button');
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(-2);
      expect(box.y).toBeGreaterThanOrEqual(-2);
      expect(box.x + box.width).toBeLessThanOrEqual(reducedViewport.width + 2);
      expect(box.y + box.height).toBeLessThanOrEqual(reducedViewport.height + 2);
    }
  });
});
