import { expect, test } from '@playwright/test';

const iPadLandscape = { width: 1180, height: 820 };

async function assertGovernanceTouchTargets(page: import('@playwright/test').Page) {
  const tooSmall = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.vish-governance-page button, .vish-workspace-shell button'),
    );
    const seen = new Set<Element>();
    const failures: string[] = [];
    for (const button of buttons) {
      if (seen.has(button)) continue;
      seen.add(button);
      const rect = button.getBoundingClientRect();
      const style = window.getComputedStyle(button);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
        continue;
      }
      if (rect.width < 43 || rect.height < 43) {
        failures.push(`${button.getAttribute('aria-label') ?? button.textContent?.trim() ?? 'button'}: ${rect.width}x${rect.height}`);
      }
    }
    return failures;
  });
  expect(tooSmall, `Governance touch targets below 44px: ${tooSmall.join(', ')}`).toEqual([]);
}

test.describe('iPad governance layout', () => {
  test('projects page fits iPad landscape without horizontal overflow', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible({ timeout: 30_000 });

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);
    await assertGovernanceTouchTargets(page);
  });

  test('change requests page fits iPad landscape', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.goto('/change-requests');
    await expect(page.getByRole('heading', { name: 'Change Requests', exact: true })).toBeVisible({ timeout: 30_000 });

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);
    await assertGovernanceTouchTargets(page);
  });
});
