import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  iPadLandscape,
  iPadPortrait,
} from './helpers';

const AUTH_TOUCH_SELECTORS = [
  '[data-testid="auth-mockup-card"] button',
  '[data-testid="auth-mockup-card"] a',
  '[data-testid="auth-mockup-card"] input[type="email"]',
  '.vish-login-page__link',
];

async function assertAuthPageLayout(page: import('@playwright/test').Page) {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
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

  test('auth primary action stays reachable when keyboard is open on iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 30_000 });

    const email = page.getByLabel(/email/i).first();
    await email.click();
    await email.fill('architect@firm.com');

    await page.evaluate(() => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 520 });
      viewport.dispatchEvent(new Event('resize'));
      viewport.dispatchEvent(new Event('scroll'));
    });

    const submit = page.getByRole('button', { name: /sign in|continue|send.*link|request access/i }).first();
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(1180 + 2);
    }
  });
});
