import type { Page } from '@playwright/test';

export async function resetWorkspacePrefs(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('vishvakarma:workspace:prefs');
    window.localStorage.removeItem('vishvakarma.os.onboardingDismissed.v1');
  });
}

export async function dismissEditorOverlays(page: Page) {
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});

  const skipWelcome = page.getByRole('button', { name: /skip.*start drawing/i });
  if (await skipWelcome.isVisible().catch(() => false)) {
    await skipWelcome.click({ force: true });
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

/** Open a non-immersive workspace page where the desktop sidebar is visible at lg breakpoints. */
export async function gotoWorkspaceShell(page: Page, path = '/projects') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Projects', exact: true }).waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
}

export async function expandSidebarIfCollapsed(page: Page) {
  const expand = page.getByRole('button', { name: /expand sidebar/i });
  if (await expand.isVisible().catch(() => false)) {
    await expand.click();
  }
}

export const iPadLandscape = { width: 1180, height: 820 };
export const iPadPortrait = { width: 820, height: 1180 };
