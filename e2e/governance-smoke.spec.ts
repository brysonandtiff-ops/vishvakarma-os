import { expect, test } from '@playwright/test';

const iPadLandscape = { width: 1180, height: 820 };

const governancePages: Array<{ path: string; heading: RegExp }> = [
  { path: '/spec-center', heading: /spec center/i },
  { path: '/registry', heading: /registry center/i },
  { path: '/change-requests', heading: /change request/i },
  { path: '/releases', heading: /release center/i },
  { path: '/world-records', heading: /world record registry/i },
  { path: '/audit', heading: /audit log/i },
];

test.describe('governance pages smoke (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });

  for (const { path, heading } of governancePages) {
    test(`${path} renders primary heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 30_000 });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      expect(overflow).toBe(false);
    });
  }
});
