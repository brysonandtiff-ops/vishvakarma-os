import { expect, test } from '@playwright/test';
import { iPadLandscape, resetWorkspacePrefs } from './helpers';

const governancePages: Array<{
  path: string;
  heading: RegExp;
  assert: (page: import('@playwright/test').Page) => Promise<void>;
}> = [
  {
    path: '/spec-center',
    heading: /spec center/i,
    assert: async (page) => {
      await expect(page.getByRole('button', { name: /new spec/i })).toBeVisible();
    },
  },
  {
    path: '/registry',
    heading: /registry center/i,
    assert: async (page) => {
      await expect(page.getByRole('button', { name: /register entry/i })).toBeVisible();
    },
  },
  {
    path: '/change-requests',
    heading: /change request/i,
    assert: async (page) => {
      await expect(page.getByRole('button', { name: /new request/i })).toBeVisible();
    },
  },
  {
    path: '/releases',
    heading: /release center/i,
    assert: async (page) => {
      await expect(page.getByText(/verification snapshot/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /download evidence pack/i })).toBeVisible();
    },
  },
  {
    path: '/world-records',
    heading: /world record registry/i,
    assert: async (page) => {
      await expect(page.getByText(/loading world record registry/i)).toBeHidden({ timeout: 60_000 });
      await expect(page.getByText(/honesty policy/i).first()).toBeVisible();
    },
  },
  {
    path: '/audit',
    heading: /audit log/i,
    assert: async (page) => {
      await expect(page.getByRole('button', { name: /open the editor/i })).toBeVisible();
    },
  },
];

test.describe('governance pages smoke (e2e local access)', () => {
  test.use({ viewport: iPadLandscape });
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await resetWorkspacePrefs(page);
  });

  for (const { path, heading, assert } of governancePages) {
    test(`${path} renders heading and primary actions`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
      await assert(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      expect(overflow).toBe(false);
    });
  }

  test('local mode shows governance backend banner', async ({ page }) => {
    await page.goto('/change-requests', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('governance-backend-banner')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /new request/i })).toBeDisabled();
  });
});
