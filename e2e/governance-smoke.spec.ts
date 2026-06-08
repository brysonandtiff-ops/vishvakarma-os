import { expect, test } from '@playwright/test';
import { iPadLandscape } from './helpers';

const governancePages: Array<{ path: string; heading: RegExp; action: RegExp }> = [
  { path: '/spec-center', heading: /spec center/i, action: /new spec/i },
  { path: '/registry', heading: /registry center/i, action: /register entry/i },
  { path: '/change-requests', heading: /change request/i, action: /new request/i },
  { path: '/releases', heading: /release center/i, action: /release gate|verification snapshot/i },
  { path: '/world-records', heading: /world record registry/i, action: /honesty policy/i },
  { path: '/audit', heading: /audit log/i, action: /open the editor/i },
];

test.describe('governance pages smoke (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });

  for (const { path, heading, action } of governancePages) {
    test(`${path} renders heading and primary actions`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(action).first()).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      expect(overflow).toBe(false);
    });
  }

  test('local mode shows governance backend banner', async ({ page }) => {
    await page.goto('/change-requests');
    await expect(page.getByTestId('governance-backend-banner')).toBeVisible();
    await expect(page.getByRole('button', { name: /new request/i })).toBeDisabled();
  });
});
