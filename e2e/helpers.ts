import { expect, type Locator, type Page } from '@playwright/test';

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
  const button = page.getByRole('button', { name: /project actions/i }).first();
  await button.evaluate((el) => {
    const scroller = el.closest<HTMLElement>('.vish-editor-action-row');
    const rect = el.getBoundingClientRect();
    if (scroller && (rect.left < 0 || rect.right > window.innerWidth)) {
      scroller.scrollLeft = Math.max(0, (el as HTMLElement).offsetLeft - scroller.clientWidth / 2);
    }
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
    const pointerInit = {
      bubbles: true,
      cancelable: true,
      button: 0,
    };
    el.dispatchEvent(new PointerEvent('pointerdown', { ...pointerInit, buttons: 1, pointerType: 'touch' }));
    el.dispatchEvent(new PointerEvent('pointerup', { ...pointerInit, buttons: 0, pointerType: 'touch' }));
    el.dispatchEvent(new MouseEvent('click', pointerInit));
  });
  const firstMenuItem = page.getByRole('menuitem').first();
  if (!(await firstMenuItem.waitFor({ state: 'visible', timeout: 1_000 }).then(() => true).catch(() => false))) {
    await button.evaluate((el) => {
      const pointerInit = {
        bubbles: true,
        cancelable: true,
        button: 0,
      };
      el.dispatchEvent(new PointerEvent('pointerdown', { ...pointerInit, buttons: 1, pointerType: 'touch' }));
      el.dispatchEvent(new PointerEvent('pointerup', { ...pointerInit, buttons: 0, pointerType: 'touch' }));
      el.dispatchEvent(new MouseEvent('click', pointerInit));
    });
    await firstMenuItem.waitFor({ state: 'visible', timeout: 5_000 });
  }
}

async function activateProjectMenuItem(page: Page, name: RegExp) {
  const item = page.getByRole('menuitem', { name }).first();
  await item.waitFor({ state: 'visible', timeout: 5_000 });
  await item.evaluate((el) => {
    (el as HTMLElement).click();
  });
}

export async function loadSampleProject(page: Page, sampleName = 'Sample House 01') {
  await openProjectActionsMenu(page);
  await activateProjectMenuItem(page, /load sample blueprint/i);
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
  await activateProjectMenuItem(page, /^save$/i);
}

export async function openExportDialog(page: Page) {
  await openProjectActionsMenu(page);
  await activateProjectMenuItem(page, /^export$/i);
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function openAIDesigner(page: Page) {
  await openProjectActionsMenu(page);
  await page.getByTestId('editor-ai-designer').evaluate((el) => {
    (el as HTMLElement).click();
  });
}


export async function selectWorkspaceMode(page: Page, mode: RegExp) {
  const tab = page.getByRole('tab', { name: mode });
  const slug = String(mode.source).replace(/^\^|\$$/g, '').replace(/\\b/g, '').toLowerCase();

  if (await tab.isVisible().catch(() => false)) {
    const tutorialTarget = page.locator(`[data-tutorial="mode-${slug}"]`);
    const target = (await tutorialTarget.count()) > 0 ? tutorialTarget : tab;
    await target.scrollIntoViewIfNeeded();
    await target.click({ force: true });
    if ((await tab.getAttribute('aria-selected')) === 'true') {
      return;
    }
    await tab.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
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

/** Scroll into view and click — reliable on iPad Safari / coarse pointer. */
export async function tapReachable(locator: Locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'nearest', inline: 'center' });
    (element as HTMLElement).click();
  });
}

/** Assert an open dialog fits inside the visual viewport on tablet. */
export async function assertActiveDialogFitsIpad(page: Page) {
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(250);

  const metrics = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const style = window.getComputedStyle(element);
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth,
      viewportHeight,
      canScroll: element.scrollHeight > element.clientHeight,
      overflowY: style.overflowY,
    };
  });

  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  if (metrics.canScroll) {
    expect(['auto', 'scroll']).toContain(metrics.overflowY);
  }

  await assertNoHorizontalOverflow(page);
  await assertTouchTargets(page, ['[role="dialog"] button', '[role="dialog"] [role="button"]']);
}

export async function readEditorMetricCount(page: Page, label: 'Walls' | 'Openings') {
  const text = await page.locator('.ws-status-bar').textContent();
  const match = text?.match(new RegExp(`${label}:\\s*(\\d+)`, 'i'));
  return Number(match?.[1] ?? 0);
}

export async function dispatchCanvasTouchPointer(
  canvas: Locator,
  type: 'pointerdown' | 'pointerup',
  position: { x: number; y: number },
) {
  await canvas.evaluate(
    (element, { eventType, pos }) => {
      const rect = element.getBoundingClientRect();
      const init: PointerEventInit = {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + pos.x,
        clientY: rect.top + pos.y,
        button: 0,
        buttons: eventType === 'pointerup' ? 0 : 1,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        width: 12,
        height: 12,
        pressure: eventType === 'pointerup' ? 0 : 0.5,
      };
      element.dispatchEvent(new PointerEvent(eventType, init));
    },
    { eventType: type, pos: position },
  );
}

export async function drawWallSegmentTouch(
  canvas: Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await dispatchCanvasTouchPointer(canvas, 'pointerdown', from);
  await dispatchCanvasTouchPointer(canvas, 'pointerup', to);
}

export async function selectDrawnWallForProperties(page: Page) {
  await page.evaluate(() => {
    const engine = (window as Window & {
      __vishFloorPlanEngine?: {
        getSnapshot: () => { manifest: { walls: Array<{ id: string }> } };
        setWallSelection: (ids: string[]) => void;
      };
    }).__vishFloorPlanEngine;
    const wallId = engine?.getSnapshot().manifest.walls.at(-1)?.id;
    if (!engine || !wallId) {
      throw new Error('E2E wall selection hook unavailable');
    }
    engine.setWallSelection([wallId]);
  });
}

export async function activateEditorTool(page: Page, label: string) {
  const button = page.getByRole('button', { name: label }).first();
  await expect(button, `${label} tool should exist`).toBeAttached();
  await tapReachable(button);
  await expect(button, `${label} tool should become active`).toHaveAttribute('aria-pressed', 'true');
}

export async function stopMotionForE2E(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}

export {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  emulateCoarsePointer,
  emulateFinePointer,
} from './deviceTouchTargets';
