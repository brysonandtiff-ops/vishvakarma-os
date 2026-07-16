import { expect, test } from '@playwright/test';

const iPadLandscape = { width: 1180, height: 820 };
const iPadPortrait = { width: 820, height: 1180 };

test.describe('iPad production readiness', () => {
  test('serves install metadata for iPad Home Screen', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /\/brand\/vishvakarma-apple-touch-icon\.png$/,
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black-translucent');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /interactive-widget=resizes-content/);
  });

  test('registers service worker shell in production preview', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration?.active || registration?.installing || registration?.waiting);
    }, { timeout: 20_000 });
  });

  test('manifest is valid and installable enough for iPad review', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe('Vishvakarma.OS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/editor?source=pwa');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('auth gate fits iPad landscape viewport', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.goto('/auth');

    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /continue with google sso/i })).toBeVisible();
    await page.screenshot({ path: 'docs/release/evidence/ipad-auth-landscape.png', fullPage: false });
  });

  test('auth gate fits iPad portrait viewport', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/auth');

    await expect(page.getByTestId('auth-mockup-card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /continue with google sso/i })).toBeVisible();
    await page.screenshot({ path: 'docs/release/evidence/ipad-auth-portrait.png', fullPage: false });
  });
});
