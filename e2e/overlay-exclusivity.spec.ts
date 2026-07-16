import { expect, test } from '@playwright/test';

const devices = [
  { name: 'ipad-landscape', width: 1180, height: 820 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'phone-portrait', width: 390, height: 844 },
];

async function attachViewportScreenshot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

async function expectSingleVisibleDialog(page: import('@playwright/test').Page) {
  await expect(page.locator('[role="dialog"]:visible')).toHaveCount(1);
}

for (const device of devices) {
  test(`global overlays remain exclusive on ${device.name}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.localStorage.removeItem('vishvakarma-analytics-consent');
      window.localStorage.removeItem('vishvakarma.os.onboardingDismissed.v1');
      window.localStorage.removeItem('vishvakarma.os.tutorialDismissed.v1');
    });

    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });

    const welcome = page.getByTestId('first-run-welcome');
    const analytics = page.getByTestId('analytics-consent');
    const qaLauncher = page.locator('.vish-device-validation__launcher');
    const qaEvidence = page.getByRole('button', { name: /open qa evidence panel/i });

    const welcomeVisible = await welcome.isVisible({ timeout: 5_000 }).catch(() => false);
    if (welcomeVisible) {
      await expect(analytics).toBeHidden();
      await expect(qaLauncher).toBeHidden();
      await expect(qaEvidence).toBeHidden();
      await expectSingleVisibleDialog(page);
      await attachViewportScreenshot(page, testInfo, `${device.name}-onboarding-only`);

      await page.getByRole('button', { name: /skip.*start drawing/i }).evaluate((element) => {
        (element as HTMLElement).click();
      });
      await expect(welcome).toBeHidden();
    }

    await expect(analytics).toBeVisible({ timeout: 15_000 });
    await expect(qaLauncher).toBeHidden();
    await expect(qaEvidence).toBeHidden();
    await expectSingleVisibleDialog(page);
    await attachViewportScreenshot(page, testInfo, `${device.name}-analytics-only`);

    await page.getByRole('button', { name: /^decline$/i }).click({ force: true });

    await expect(analytics).toBeHidden();
    await expect(qaLauncher).toBeVisible({ timeout: 10_000 });
    await expect(qaEvidence).toBeVisible();
    await expect(page.locator('[role="dialog"]:visible')).toHaveCount(0);
    await attachViewportScreenshot(page, testInfo, `${device.name}-qa-ready`);
  });
}
