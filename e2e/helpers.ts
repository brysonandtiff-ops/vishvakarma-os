import { expect, type Locator, type Page } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  emulateCoarsePointer,
  emulateFinePointer,
} from './deviceTouchTargets';

/** 3D pane may render WebGL or a graceful fallback in headless WebKit/Firefox. */
export async function expect3DPreviewPane(page: Page) {
  await expect(page.locator('.ws-pane-label', { hasText: '3D Preview' })).toBeVisible({ timeout: 30_000 });
  const pane = page.locator('.vish-3d-viewport-pane');
  await expect(pane).toBeVisible({ timeout: 15_000 });
  const fallback = page.getByText('3D Preview Unavailable');
  if (await fallback.isVisible().catch(() => false)) return;
  await expect(pane.locator('canvas').first()).toBeAttached({ timeout: 30_000 });
}

export async function hasWebGL3DPreview(page: Page) {
  const fallback = page.getByText('3D Preview Unavailable');
  if (await fallback.isVisible().catch(() => false)) return false;
  return (await page.locator('.vish-3d-viewport-pane canvas').count()) > 0;
}

export async function resetWorkspacePrefs(page: Page) {
  await page.addInitScript(() => {
    const removeAuthLikeStorage = (storage: Storage) => {
      for (const key of Object.keys(storage)) {
        const normalized = key.toLowerCase();
        if (
          normalized.startsWith('sb-') ||
          normalized.includes('supabase') ||
          normalized.includes('auth-token') ||
          normalized.includes('pendingemail')
        ) {
          storage.removeItem(key);
        }
      }
    };

    removeAuthLikeStorage(window.localStorage);
    removeAuthLikeStorage(window.sessionStorage);
    window.localStorage.removeItem('vishvakarma:workspace:prefs');
    window.localStorage.removeItem('vishvakarma.os.supabase.session.v1');
    window.localStorage.removeItem('vishvakarma.os.supabase.pendingEmail.v1');
    window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
  });
}

async function dismissVisibleControl(target: Locator) {
  const control = target.first();
  if (!(await control.isVisible({ timeout: 1_000 }).catch(() => false))) return false;
  const clicked = await control.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
  if (clicked) return true;
  return control
    .evaluate((element) => {
      (element as HTMLElement).click();
    })
    .then(() => true)
    .catch(() => false);
}

export async function dismissTutorialIfPresent(page: Page) {
  await dismissVisibleControl(page.getByRole('button', { name: /skip tutorial/i }));
  await dismissVisibleControl(page.locator('[data-testid="tutorial-card"] button[aria-label="Skip tutorial"]'));
}

export async function gotoAppPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (path.startsWith('/editor')) {
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
  }
}

export async function dismissConsentIfPresent(page: Page) {
  await dismissVisibleControl(page.getByRole('button', { name: /decline/i }));
}

async function findProjectActionsButton(page: Page): Promise<Locator> {
  await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 });
  const candidates = [
    page.getByTestId('editor-project-actions'),
    page.getByRole('button', { name: /project actions/i }),
    page.locator('button[data-tutorial="project-actions"]'),
    page.locator('.vish-editor-action-row button[aria-label="Project actions"]'),
  ];
  let fallback: Locator | null = null;
  for (const candidate of candidates) {
    if ((await candidate.count().catch(() => 0)) > 0) {
      const first = candidate.first();
      fallback ??= first;
      if (await first.isVisible({ timeout: 1_000 }).catch(() => false)) return first;
    }
  }
  if (fallback) return fallback;

  const buttonClues = await page.locator('button').evaluateAll((buttons) =>
    buttons.slice(0, 30).map((button) => {
      const label = button.getAttribute('aria-label');
      const testId = button.getAttribute('data-testid');
      const tutorial = button.getAttribute('data-tutorial');
      const text = button.textContent?.trim();
      return [label, testId, tutorial, text].filter(Boolean).join(' / ') || 'unnamed button';
    }),
  ).catch(() => [] as string[]);
  throw new Error(`Project actions button not found after editor top bar loaded. Button clues: ${buttonClues.join(' | ')}`);
}

async function pressMenuButton(button: Locator) {
  await button.waitFor({ state: 'visible', timeout: 15_000 });
  await button.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
  const clicked = await button.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
  if (clicked) return;

  await button.evaluate((el) => {
    const scroller = el.closest<HTMLElement>('.vish-editor-action-row');
    const rect = el.getBoundingClientRect();
    if (scroller && (rect.left < 0 || rect.right > window.innerWidth)) {
      scroller.scrollLeft = Math.max(0, (el as HTMLElement).offsetLeft - scroller.clientWidth / 2);
    }
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
    const pointerInit = { bubbles: true, cancelable: true, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', { ...pointerInit, buttons: 1, pointerType: 'touch' }));
    el.dispatchEvent(new PointerEvent('pointerup', { ...pointerInit, buttons: 0, pointerType: 'touch' }));
    el.dispatchEvent(new MouseEvent('click', pointerInit));
  });
}

export async function openProjectActionsMenu(page: Page) {
  await dismissTutorialIfPresent(page).catch(() => {});
  const button = await findProjectActionsButton(page);
  await pressMenuButton(button);
  const firstMenuItem = page.getByRole('menuitem').first();
  if (!(await firstMenuItem.waitFor({ state: 'visible', timeout: 1_500 }).then(() => true).catch(() => false))) {
    await button.click({ force: true, timeout: 5_000 }).catch(async () => pressMenuButton(button));
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

async function openSampleDialogFromDirectAction(page: Page) {
  const directDemo = page.getByTestId('editor-demo-quick-action');
  if (!(await directDemo.isVisible({ timeout: 1_500 }).catch(() => false))) return false;

  await directDemo.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
  await directDemo.evaluate((element) => {
    const init = { bubbles: true, cancelable: true, button: 0 };
    element.dispatchEvent(new PointerEvent('pointerdown', {
      ...init,
      buttons: 1,
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
    }));
    element.dispatchEvent(new PointerEvent('pointerup', {
      ...init,
      buttons: 0,
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
    }));
  });

  return page
    .getByRole('dialog', { name: /load sample blueprint/i })
    .waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
}

export async function loadSampleProject(page: Page, sampleName = 'Sample House 01') {
  const openedDirectly = await openSampleDialogFromDirectAction(page);
  if (!openedDirectly) {
    await openProjectActionsMenu(page);
    await activateProjectMenuItem(page, /load sample blueprint|load demo blueprint/i);
  }

  const dialog = page.getByRole('dialog', { name: /load sample blueprint/i });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  if (sampleName !== 'Sample House 01') {
    await page.getByRole('button', { name: sampleName }).click();
  }
  await page.getByRole('button', { name: /load blueprint/i }).click();
  await page.getByTestId('blueprint-canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(() => {
    const bar = document.querySelector('.ws-status-bar');
    const text = bar?.textContent ?? '';
    const match = text.match(/Walls:\s*(\d+)/i);
    return Boolean(match && Number(match[1]) > 0);
  }, { timeout: 30_000 }).catch(() => {});
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
  const item = page.getByTestId('editor-ai-designer');
  await item.waitFor({ state: 'visible', timeout: 5_000 });
  await item.evaluate((el) => {
    (el as HTMLElement).click();
  });
}

export async function selectWorkspaceMode(page: Page, mode: RegExp) {
  const tab = page.getByRole('tab', { name: mode });
  const slug = String(mode.source).replace(/^\^|\$$/g, '').replace(/\b/g, '').toLowerCase();
  if (await tab.isVisible().catch(() => false)) {
    const tutorialTarget = page.locator(`[data-tutorial="mode-${slug}"]`);
    const target = (await tutorialTarget.count()) > 0 ? tutorialTarget : tab;
    await target.scrollIntoViewIfNeeded();
    await target.click({ force: true });
    if ((await tab.getAttribute('aria-selected')) === 'true') return;
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

export async function tapReachable(target: Locator) {
  await target.waitFor({ state: 'visible', timeout: 15_000 });
  await target.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
  const clicked = await target.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
  if (clicked) return;
  await target.evaluate((element) => {
    element.scrollIntoView({ block: 'nearest', inline: 'center' });
    const init = { bubbles: true, cancelable: true, button: 0 };
    element.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1, pointerType: 'touch' }));
    element.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, pointerType: 'touch' }));
    element.dispatchEvent(new MouseEvent('click', init));
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function activateEditorTool(page: Page, toolName: string) {
  const pattern = new RegExp(`^${escapeRegExp(toolName)}(?:\\b|$)`, 'i');
  const rail = page.getByTestId('tool-rail');
  const candidates = [
    rail.getByRole('button', { name: pattern }).first(),
    page.getByRole('button', { name: pattern }).first(),
    page.locator(`[data-tool="${toolName.toLowerCase()}"]`).first(),
  ];
  for (const candidate of candidates) {
    if ((await candidate.count().catch(() => 0)) === 0) continue;
    if (!(await candidate.isVisible({ timeout: 1_000 }).catch(() => false))) continue;
    await tapReachable(candidate);
    return;
  }
  throw new Error(`Editor tool not found: ${toolName}`);
}

type CanvasPoint = { x: number; y: number };
type CanvasPointerType = 'pointerdown' | 'pointermove' | 'pointerup';

export async function dispatchCanvasTouchPointer(canvas: Locator, eventType: CanvasPointerType, point: CanvasPoint) {
  await canvas.evaluate((element, payload) => {
    const rect = element.getBoundingClientRect();
    const isUp = payload.eventType === 'pointerup';
    element.dispatchEvent(new PointerEvent(payload.eventType, {
      bubbles: true,
      cancelable: true,
      pointerId: 73,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: isUp ? 0 : 1,
      pressure: isUp ? 0 : 0.5,
      clientX: rect.left + payload.point.x,
      clientY: rect.top + payload.point.y,
    }));
  }, { eventType, point });
}

export async function drawWallSegmentTouch(canvas: Locator, from: CanvasPoint, to: CanvasPoint) {
  await dispatchCanvasTouchPointer(canvas, 'pointerdown', from);
  await dispatchCanvasTouchPointer(canvas, 'pointerup', from);
  await canvas.page().waitForTimeout(40);
  await dispatchCanvasTouchPointer(canvas, 'pointerdown', to);
  for (let step = 1; step <= 4; step += 1) {
    await dispatchCanvasTouchPointer(canvas, 'pointermove', {
      x: from.x + ((to.x - from.x) * step) / 4,
      y: from.y + ((to.y - from.y) * step) / 4,
    });
  }
  await dispatchCanvasTouchPointer(canvas, 'pointerup', to);
}

export async function readEditorMetricCount(page: Page, label: string) {
  const text = await page.locator('.ws-status-bar').textContent().catch(() => '');
  const match = text?.match(new RegExp(`${escapeRegExp(label)}:\\s*(\\d+)`, 'i'));
  return match ? Number(match[1]) : 0;
}

export async function selectDrawnWallForProperties(page: Page) {
  const canvas = page.getByTestId('blueprint-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Blueprint canvas is not visible');
  const attempts = [0.5, 0.45, 0.55];
  for (const yRatio of attempts) {
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * yRatio);
    if (await page.getByTestId('wall-property-length').isVisible({ timeout: 1_500 }).catch(() => false)) return;
  }
  throw new Error('Unable to select the drawn wall for properties inspection');
}

export async function stopMotionForE2E(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

export async function assertActiveDialogFitsIpad(page: Page) {
  const dialog = page.getByRole('dialog').filter({ visible: true }).last();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(-2);
  expect(box.y).toBeGreaterThanOrEqual(-2);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2);
}

export async function dismissEditorOverlays(page: Page) {
  await page.goto('/editor', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
  await dismissVisibleControl(page.getByRole('button', { name: /skip.*start drawing/i }));
  await dismissVisibleControl(page.getByRole('button', { name: /close|dismiss|got it/i }));
  await dismissVisibleControl(page.getByRole('button', { name: /discard draft/i }));
  await dismissConsentIfPresent(page);
  await dismissTutorialIfPresent(page);
}

/** Open a non-immersive workspace page where the desktop sidebar is visible at lg breakpoints. */
export async function gotoWorkspaceShell(page: Page, path = '/projects') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Projects', exact: true }).waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
}

export async function expandSidebarIfCollapsed(page: Page) {
  const expand = page.getByRole('button', { name: /expand sidebar/i });
  if (await expand.isVisible().catch(() => false)) await expand.click();
}

export const iPadLandscape = { width: 1180, height: 820 };
export const iPadPortrait = { width: 820, height: 1180 };
export const androidTabletLandscape = { width: 1280, height: 800 };
/** iPhone 14/15 class portrait */
export const iPhonePortrait = { width: 390, height: 844 };
export const iPhoneLandscape = { width: 844, height: 390 };
export const desktopLandscape = { width: 1440, height: 900 };

export async function applyTouchMode(page: Page, viewport: { width: number; height: number }) {
  const isTouch = viewport.width <= iPadLandscape.width;
  if (isTouch) await emulateCoarsePointer(page);
  else await emulateFinePointer(page);
}

export {
  assertNoHorizontalOverflow,
  assertTouchTargets,
  emulateCoarsePointer,
  emulateFinePointer,
};
