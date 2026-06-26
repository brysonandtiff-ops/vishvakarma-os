import { expect, test, type Page } from '@playwright/test';

const SOAK_MS = Number(process.env.VISH_SOAK_MS ?? '60000');
const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong|Unhandled Runtime Error/i;
const POST_SOAK_TOOLS = ['Select', 'Wall', 'Dimension'];

async function seedAppSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify({
        provider: 'supabase',
        uid: 'e2e-soak-user',
        email: 'soak-proof@vishvakarma.local',
        idToken: 'soak-proof-access-token',
        refreshToken: 'soak-proof-refresh-token',
        expiresAt: Date.now() + 86_400_000,
      }),
    );
  });

  await page.route('**/rest/v1/profiles**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

async function dismissBlockingChrome(page: Page) {
  const recoveryDiscard = page.getByRole('button', { name: /discard draft/i });
  if (await recoveryDiscard.isVisible().catch(() => false)) {
    await recoveryDiscard.click({ force: true });
  }

  const dismissGuided = page.getByRole('button', { name: /dismiss guided start/i });
  if (await dismissGuided.isVisible().catch(() => false)) {
    await dismissGuided.click({ force: true });
  }

  const declineAnalytics = page.getByRole('button', { name: /decline/i });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click({ force: true });
  }
}

async function activateTool(page: Page, label: string) {
  const button = page.getByRole('button', { name: label }).first();
  await expect(button, `${label} tool should exist`).toBeAttached();
  await button.evaluate((element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await expect(button, `${label} tool should become active`).toHaveAttribute('aria-pressed', 'true');
}

test.describe('long-session editor soak proof', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedAppSession(page);
  });

  test('editor remains usable after the configured soak window', async ({ page }) => {
    test.setTimeout(SOAK_MS + 60_000);

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await dismissBlockingChrome(page);
    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(BLOCKED_COPY);

    await page.waitForTimeout(SOAK_MS);

    await expect(page.getByTestId('editor-top-bar')).toBeVisible();
    await expect(page.getByTestId('tool-rail')).toBeVisible();

    for (const label of POST_SOAK_TOOLS) {
      const button = page.getByRole('button', { name: label }).first();
      await expect(button, `${label} should still be attached after soak`).toBeAttached();
      await button.evaluate((element) => {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await expect(button, `${label} should still activate after soak`).toHaveAttribute('aria-pressed', 'true');
    }

    await expect(page.locator('body')).not.toContainText(BLOCKED_COPY);
  });
});
