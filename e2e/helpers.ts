import { expect, type Page } from '@playwright/test';

/** 3D pane may render WebGL or a graceful fallback in headless WebKit/Firefox. */
export async function expect3DPreviewPane(page: Page) {
  await expect(page.locator('.ws-pane-label', { hasText: '3D Preview' })).toBeVisible({ timeout: 30_000 });
  const pane = page.locator('.vish-3d-viewport-pane');
  await expect(pane).toBeVisible({ timeout: 15_000 });
  const fallback = page.getByText('3D Preview Unavailable');
  if (await fallback.isVisible().catch(() => false)) {
    return;
  }
  await expect(pane.locator('canvas').first()).toBeAttached({ timeout: 30_000 });
}

export async function hasWebGL3DPreview(page: Page) {
  const fallback = page.getByText('3D Preview Unavailable');
  if (await fallback.isVisible().catch(() => false)) {
    return false;
  }
  return (await page.locator('.vish-3d-viewport-pane canvas').count()) > 0;
}

export async function resetWorkspacePrefs(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('vishvakarma:workspace:prefs');
    window.localStorage.removeItem('vishvakarma.os.supabase.session.v1');
    window.localStorage.removeItem('vishvakarma.os.supabase.pendingEmail.v1');
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
  });
}

export async function dismissTutorialIfPresent(page: Page) {
  const skipTutorial = page.getByRole('button', { name: /skip tutorial/i });
  if (await skipTutorial.isVisible().catch(() => false)) {
    await skipTutorial.click({ force: true });
  }

  const tutorialClose = page.locator('[data-testid="tutorial-card"] button[aria-label="Skip tutorial"]');
  if (await tutorialClose.isVisible().catch(() => false)) {
    await tutorialClose.click({ force: true });
  }
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

export async function openProjectActionsMenu(page: Page) {
  await page.getByRole('button', { name: /project actions/i }).click();
}

export async function loadSampleProject(page: Page, sampleName = 'Sample House 01') {
  await openProjectActionsMenu(page);
  await page.getByRole('menuitem', { name: /load sample/i }).click();
  await expect(page.getByRole('dialog', { name: /load sample blueprint/i })).toBeVisible({ timeout: 15_000 });
  if (sampleName !== 'Sample House 01') {
    await page.getByRole('button', { name: sampleName }).click();
  }
  await page.getByRole('button', { name: /load blueprint/i }).click();
  await page.getByTestId('blueprint-canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await page
    .waitForFunction(
      () => {
        const bar = document.querySelector('.ws-status-bar');
        const text = bar?.textContent ?? '';
        const match = text.match(/Walls:\s*(\d+)/i);
        return Boolean(match && Number(match[1]) > 0);
      },
      { timeout: 30_000 },
    )
    .catch(() => {});
}

export async function saveProject(page: Page) {
  await openProjectActionsMenu(page);
  await page.getByRole('menuitem', { name: /^save$/i }).click();
}

export async function openExportDialog(page: Page) {
  await openProjectActionsMenu(page);
  await page.getByRole('menuitem', { name: /^export$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function openAIDesigner(page: Page) {
  await openProjectActionsMenu(page);
  await page.getByTestId('editor-ai-designer').click();
}


export async function selectWorkspaceMode(page: Page, mode: RegExp) {
  const tab = page.getByRole('tab', { name: mode });
  if (await tab.isVisible().catch(() => false)) {
    await tab.click({ force: true });
    return;
  }
  const badge = page.getByTestId('editor-mode-badge');
  await expect(badge).toBeVisible({ timeout: 15_000 });
  await badge.click({ force: true });
  await page.getByRole('menuitem', { name: mode }).click({ force: true });
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

  await dismissTutorialIfPresent(page);
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
/** iPhone 14/15 class portrait */
export const iPhonePortrait = { width: 390, height: 844 };
/** iPhone landscape — keyboard + safe-area smoke */
export const iPhoneLandscape = { width: 844, height: 390 };
/** Galaxy Tab class landscape */
export const androidTabletLandscape = { width: 1280, height: 800 };
/** Desktop fine-pointer baseline */
export const desktopLandscape = { width: 1280, height: 800 };

export {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  emulateCoarsePointer,
  emulateFinePointer,
} from './deviceTouchTargets';
