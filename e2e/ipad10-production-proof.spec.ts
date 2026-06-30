import { expect, test, type Page } from '@playwright/test';

const iPad10Landscape = { width: 1180, height: 820 };
const iPad10Portrait = { width: 820, height: 1180 };
const forbiddenRuntimeCopy = /Backend not configured|Service configuration required|fatal app copy|Unhandled Runtime Error/i;

async function waitForAppShell(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.locator('#boot-splash').waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
}

async function expectNoFatalRuntimeCopy(page: Page) {
  await expect(page.getByText(forbiddenRuntimeCopy)).toHaveCount(0);
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    htmlScrollWidth: document.documentElement.scrollWidth,
    htmlClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body?.scrollWidth ?? 0,
    bodyClientWidth: document.body?.clientWidth ?? document.documentElement.clientWidth,
  }));

  expect(metrics.htmlScrollWidth).toBeLessThanOrEqual(metrics.htmlClientWidth + 4);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 4);
}

async function expectAuthSurface(page: Page) {
  await expect(
    page.getByText(/Vishvakarma\.OS|Continue with Google|Google OAuth|magic link|email/i).first(),
  ).toBeVisible({ timeout: 20_000 });
}

test.describe('live iPad 10 production proof', () => {
  test('auth renders in iPad 10 landscape without fatal copy or destructive overflow', async ({ page }) => {
    await page.setViewportSize(iPad10Landscape);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForAppShell(page);

    await expectNoFatalRuntimeCopy(page);
    await expectNoHorizontalOverflow(page);
    await expectAuthSurface(page);
  });

  test('auth renders in iPad 10 portrait without fatal copy or destructive overflow', async ({ page }) => {
    await page.setViewportSize(iPad10Portrait);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForAppShell(page);

    await expectNoFatalRuntimeCopy(page);
    await expectNoHorizontalOverflow(page);
    await expectAuthSurface(page);
  });

  test('iPad PWA and iOS Home Screen metadata are present', async ({ page, request }) => {
    await page.setViewportSize(iPad10Landscape);
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /\/brand\/vishvakarma-apple-touch-icon\.png$/,
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Vishvakarma.OS');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /interactive-widget=resizes-content/);

    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    const body = await manifest.json();
    expect(body.name).toBe('Vishvakarma.OS');
    expect(body.display).toBe('standalone');
    expect(body.start_url).toBe('/editor?source=pwa');
    expect(body.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('signed-out editor route stays protected on iPad 10 landscape', async ({ page }) => {
    await page.setViewportSize(iPad10Landscape);
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await waitForAppShell(page);

    await expectNoFatalRuntimeCopy(page);
    await expectNoHorizontalOverflow(page);

    const authCopyVisible = await page
      .getByText(/Continue with Google|Google OAuth|magic link|email|account access/i)
      .first()
      .isVisible()
      .catch(() => false);
    const editorTopBarVisible = await page
      .locator('[data-testid="editor-top-bar"]')
      .isVisible()
      .catch(() => false);

    expect(authCopyVisible || page.url().includes('/auth')).toBeTruthy();
    expect(editorTopBarVisible).toBeFalsy();
  });
});
