import { expect, test, type Page } from '@playwright/test';
import {
  desktopLandscape,
  dismissConsentIfPresent,
  dismissEditorOverlays,
  expect3DPreviewPane,
  iPadLandscape,
  iPadPortrait,
  iPhoneLandscape,
  iPhonePortrait,
  loadSampleProject,
  openExportDialog,
  resetWorkspacePrefs,
} from './helpers';
import { assertNoHorizontalOverflow, assertTouchTargets } from './deviceTouchTargets';

test.use({ storageState: { cookies: [], origins: [] } });

const authDeviceMatrix = [
  ['desktop', desktopLandscape],
  ['ipad-landscape', iPadLandscape],
  ['ipad-portrait', iPadPortrait],
  ['phone-portrait', iPhonePortrait],
  ['phone-landscape', iPhoneLandscape],
] as const;

const protectedRouteSmoke = [
  { path: '/projects', label: 'Projects', heading: /your projects/i },
  { path: '/releases', label: 'Releases', heading: /^Release Center$/i },
  { path: '/audit', label: 'Audit', heading: /^Audit Log$/i },
  { path: '/optimization', label: 'Optimization', heading: /^Design Battle$/i },
] as const;

async function pageBootSnapshot(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('#root');
    const scripts = Array.from(document.querySelectorAll('script[src]'))
      .map((script) => script.getAttribute('src'))
      .filter(Boolean)
      .slice(0, 10);
    const bodyText = document.body.innerText.replace(/\s+/g, ' ').slice(0, 900);
    const rootText = (root?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 900);
    const testIds = Array.from(document.querySelectorAll('[data-testid]'))
      .map((element) => element.getAttribute('data-testid'))
      .filter(Boolean)
      .slice(0, 50);
    return {
      href: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      readyState: document.readyState,
      rootChildCount: root?.childElementCount ?? 0,
      rootText,
      bodyText,
      testIds,
      scripts,
    };
  });
}

async function expectVisibleWithBootDiagnostics(page: Page, locator: ReturnType<Page['locator']>, label: string, timeout = 30_000) {
  try {
    await expect(locator).toBeVisible({ timeout });
  } catch (error) {
    const snapshot = await pageBootSnapshot(page).catch((snapshotError) => ({
      error: snapshotError instanceof Error ? snapshotError.message : String(snapshotError),
    }));
    throw new Error(`${label} did not become visible. Boot snapshot: ${JSON.stringify(snapshot, null, 2)}\nOriginal error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function expectNoCrashBoundary(page: Page) {
  await expect(page.getByText(/an unexpected rendering error occurred/i)).toHaveCount(0);
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
}

async function expectGoogleOnlyAuth(page: Page) {
  const googleButton = page.getByTestId('google-sso-button');

  await expectVisibleWithBootDiagnostics(page, page.getByTestId('auth-page'), 'auth-page', 30_000);
  await expectVisibleWithBootDiagnostics(page, googleButton, 'google-sso-button', 15_000);
  await expect(googleButton).toContainText(/continue with google sso/i);

  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/magic link/i)).toHaveCount(0);
  await expect(page.getByText(/enter local workspace/i)).toHaveCount(0);
  await expect(page.getByText(/continue with apple/i)).toHaveCount(0);
  await expect(page.getByText(/forgot password/i)).toHaveCount(0);
}

async function activateAllFeaturesTab(page: Page) {
  const tab = page.getByTestId('features-tab-all');
  await expectVisibleWithBootDiagnostics(page, tab, 'features all tab');
  await tab.evaluate((element) => (element as HTMLButtonElement).click());
  await page.waitForFunction(() => {
    const trigger = document.querySelector('[data-testid="features-tab-all"]');
    const panel = document.querySelector('[data-testid="features-panel-all"]');
    return trigger?.getAttribute('data-state') === 'active' && panel?.getAttribute('data-state') === 'active' && !panel.hasAttribute('hidden');
  }, { timeout: 15_000 });
}

test.describe('QE engineering pass — auth and route smoke', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    page.on('pageerror', (error) => {
      console.error(`[qe-browser:${testInfo.title}] pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
      if (!['error', 'warning'].includes(message.type())) return;
      console.error(`[qe-browser:${testInfo.title}] ${message.type()}: ${message.text()}`);
    });
    await resetWorkspacePrefs(page);
  });

  for (const [deviceName, viewport] of authDeviceMatrix) {
    test(`auth is Google SSO-only and safe on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });
      await dismissConsentIfPresent(page);
      await expectGoogleOnlyAuth(page);
      await expectNoCrashBoundary(page);
      await assertNoHorizontalOverflow(page);
      await assertTouchTargets(page, ['button', 'a.touch-target'], viewport.width < 700 ? 42 : 44);
    });
  }

  test('public marketing routes render without crash or overflow', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await expectVisibleWithBootDiagnostics(page, page.getByText(/Sacred 3D View/i).first(), 'landing Sacred 3D View');
    await expect(page.getByRole('link', { name: /try lite editor/i })).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);

    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await activateAllFeaturesTab(page);
    const allFeaturesPanel = page.getByTestId('features-panel-all');
    await expect(allFeaturesPanel.getByText(/2D Drafting/i)).toBeVisible();
    await expect(allFeaturesPanel.getByText(/Collaboration/i)).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);
    await expectVisibleWithBootDiagnostics(page, page.getByRole('heading', { name: /professional-grade tools/i }), 'pricing heading');
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
  });

  test('protected workspace routes render in local QE mode', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);

    for (const route of protectedRouteSmoke) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await dismissConsentIfPresent(page);
      await expectVisibleWithBootDiagnostics(page, page.getByRole('heading', { name: route.heading }).first(), `${route.label} route heading`);
      await expectNoCrashBoundary(page);
      await assertNoHorizontalOverflow(page);
    }
  });

  test('full editor critical path: sample, 3D, export', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await dismissEditorOverlays(page);
    await expectVisibleWithBootDiagnostics(page, page.getByTestId('editor-top-bar'), 'editor top bar', 60_000);

    await loadSampleProject(page);
    await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /toggle 3d view/i }).click({ force: true });
    await expect3DPreviewPane(page);

    await openExportDialog(page);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');

    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
  });

  test('lite editor recovery path: 2D, 3D, tools, export JSON', async ({ page }) => {
    await page.setViewportSize(iPadLandscape);
    await page.goto('/editor-lite', { waitUntil: 'domcontentloaded' });
    await dismissConsentIfPresent(page);

    const liteEditor = page.getByTestId('lite-editor-page');
    await expectVisibleWithBootDiagnostics(page, liteEditor, 'lite editor page', 60_000);
    await expect(page.getByTestId('lite-blueprint-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('lite-3d-pane')).toBeVisible({ timeout: 30_000 });

    for (const tool of ['Select', 'Wall', 'Door', 'Window', 'Pan', 'Delete']) {
      const button = liteEditor.getByRole('button', { name: tool, exact: true });
      await expect(button).toBeVisible({ timeout: 10_000 });
      await button.click({ force: true });
    }

    await expect(liteEditor.getByRole('button', { name: /export json/i })).toBeVisible();
    await expectNoCrashBoundary(page);
    await assertNoHorizontalOverflow(page);
    await assertTouchTargets(page, ['button', 'a.touch-target'], 44);
  });
});
