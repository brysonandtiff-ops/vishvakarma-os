import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  iPadLandscape,
  iPadPortrait,
} from './helpers';

const AUTH_TOUCH_SELECTORS = [
  '[data-testid="auth-mockup-card"] .vish-login-page__primary',
  '[data-testid="auth-mockup-card"] .vish-login-page__secondary',
  '.vish-auth-google-button',
];

async function dismissAnalyticsConsent(page: import('@playwright/test').Page) {
  const decline = page.getByRole('button', { name: /^decline$/i });
  if (await decline.isVisible().catch(() => false)) {
    await decline.click();
  }
}

async function assertAuthPageLayout(page: import('@playwright/test').Page) {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await dismissAnalyticsConsent(page);
  await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
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

  test('Google SSO action stays reachable when the iPad visual viewport shrinks', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await dismissAnalyticsConsent(page);
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 520 });
      viewport?.dispatchEvent(new Event('resize'));
      viewport?.dispatchEvent(new Event('scroll'));
    });

    const submit = page.getByRole('button', { name: /continue with google sso/i });
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(iPadPortrait.height + 2);
    }
  });
});
