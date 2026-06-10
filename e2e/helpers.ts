import { expect, type Page } from '@playwright/test';

/** 3D pane may render WebGL or a graceful fallback in headless WebKit/Firefox. */
export async function expect3DPreviewPane(page: Page) {
  await expect(page.locator('.ws-pane-label', { hasText: '3D Preview' })).toBeVisible({ timeout: 30_000 });
  const fallback = page.getByText('3D Preview Unavailable');
  const canvas = page.locator('.bg-ws-canvas canvas').first();
  await expect(fallback.or(canvas)).toBeVisible({ timeout: 15_000 });
}

export async function resetWorkspacePrefs(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('vishvakarma:workspace:prefs');
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
  });
}

export async function gotoAppPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (path.startsWith('/editor')) {
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
  }
}

export async function dismissConsentIfPresent(page: Page) {
  const declineAnalytics = page.getByRole('button', { name: /decline/i });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click({ force: true, timeout: 5_000 }).catch(() => {});
  }
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

  const declineAnalytics = page.getByRole('button', { name: /decline/i });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click();
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
