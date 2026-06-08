import type { Page } from '@playwright/test';

export async function dismissEditorOverlays(page: Page) {
  await page.goto('/editor');

  const skipWelcome = page.getByRole('button', { name: /skip.*start drawing/i });
  if (await skipWelcome.isVisible().catch(() => false)) {
    await skipWelcome.click();
  }

  const onboardingClose = page.getByRole('button', { name: /close|dismiss|got it/i });
  if (await onboardingClose.first().isVisible().catch(() => false)) {
    await onboardingClose.first().click();
  }

  const recoveryDiscard = page.getByRole('button', { name: /discard draft/i });
  if (await recoveryDiscard.isVisible().catch(() => false)) {
    await recoveryDiscard.click();
  }
}

export const iPadLandscape = { width: 1180, height: 820 };
export const iPadPortrait = { width: 820, height: 1180 };
