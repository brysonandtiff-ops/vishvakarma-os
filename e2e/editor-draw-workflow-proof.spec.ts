import { expect, test, type Locator, type Page } from '@playwright/test';

const BLOCKED_COPY = /Backend not configured|Service configuration required|Application error|Something went wrong/i;

async function seedAppSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
    window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
    window.localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify({
        provider: 'supabase',
        uid: 'e2e-draw-proof-user',
        email: 'e2e-draw@vishvakarma.local',
        idToken: 'e2e-draw-access-token',
        refreshToken: 'e2e-draw-refresh-token',
        expiresAt: Date.now() + 86_400_000,
      }),
    );
  });

  await page.route('**/rest/v1/profiles**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

async function stopMotion(page: Page) {
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

async function readMetricCount(page: Page, label: 'Walls' | 'Openings') {
  const text = await page.locator('.ws-status-bar').textContent();
  const match = text?.match(new RegExp(`${label}:\\s*(\\d+)`, 'i'));
  return Number(match?.[1] ?? 0);
}

async function dispatchCanvasPointer(
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
        pointerType: 'mouse',
        isPrimary: true,
      };
      element.dispatchEvent(new PointerEvent(eventType, init));
    },
    { eventType: type, pos: position },
  );
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

async function drawWallSegment(canvas: Locator, from: { x: number; y: number }, to: { x: number; y: number }) {
  await dispatchCanvasPointer(canvas, 'pointerdown', from);
  await dispatchCanvasPointer(canvas, 'pointerup', to);
}

test.describe('editor draw workflow proof', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedAppSession(page);
  });

  test('draws a wall, places a door, and shows properties', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await stopMotion(page);
    await dismissBlockingChrome(page);

    await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('tool-rail')).toBeVisible();
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

    const initialWalls = await readMetricCount(page, 'Walls');
    const initialOpenings = await readMetricCount(page, 'Openings');

    await activateTool(page, 'Wall');

    const canvas = page.getByTestId('blueprint-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not visible');

    const centerY = box.height * 0.5;
    const from = { x: box.width * 0.25, y: centerY };
    const to = { x: box.width * 0.75, y: centerY };
    await drawWallSegment(canvas, from, to);

    await expect
      .poll(async () => readMetricCount(page, 'Walls'), { timeout: 15_000 })
      .toBeGreaterThan(initialWalls);

    await activateTool(page, 'Door');

    const doorPoint = { x: box.width * 0.5, y: centerY };
    await dispatchCanvasPointer(canvas, 'pointerdown', doorPoint);
    await dispatchCanvasPointer(canvas, 'pointerup', doorPoint);

    await expect
      .poll(async () => readMetricCount(page, 'Openings'), { timeout: 15_000 })
      .toBeGreaterThan(initialOpenings);

    await activateTool(page, 'Select');
    await dispatchCanvasPointer(canvas, 'pointerdown', doorPoint);
    await dispatchCanvasPointer(canvas, 'pointerup', doorPoint);

    await expect(page.getByText(/^Properties$/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/wall properties/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('wall-property-length')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/openings/i).first()).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(BLOCKED_COPY)).toHaveCount(0);
  });
});
