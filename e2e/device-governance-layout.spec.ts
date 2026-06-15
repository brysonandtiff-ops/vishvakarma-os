import { expect, test } from '@playwright/test';
import {
  androidTabletLandscape,
  assertNoHorizontalOverflow,
  assertTouchTargets,
  emulateCoarsePointer,
  iPadLandscape,
  iPadPortrait,
  iPhonePortrait,
} from './helpers';

const GOVERNANCE_ROUTES = [
  { path: '/projects', heading: /your projects/i },
  { path: '/change-requests', heading: 'Change Requests' },
  { path: '/optimization', heading: 'Design Battle' },
  { path: '/profile', heading: 'Profile' },
  { path: '/spec-center', heading: 'Spec Center' },
  { path: '/registry', heading: 'Registry Center' },
  { path: '/releases', heading: 'Release Center' },
  { path: '/world-records', heading: 'World Record Registry' },
  { path: '/audit', heading: 'Audit Log' },
] as const;

const GOVERNANCE_TOUCH_SELECTORS = [
  '.vish-governance-page button',
  '.vish-governance-page [role="tab"]',
];

async function assertGovernancePage(
  page: import('@playwright/test').Page,
  path: string,
  heading: string | RegExp,
) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const headingLocator =
    typeof heading === 'string'
      ? page.getByRole('heading', { name: heading, exact: true })
      : page.getByRole('heading', { name: heading });
  await expect(headingLocator.first()).toBeVisible({ timeout: 30_000 });
  await assertNoHorizontalOverflow(page);
  await assertTouchTargets(page, GOVERNANCE_TOUCH_SELECTORS);
}

test.describe('Device governance layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
      window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
    });
  });

  for (const route of GOVERNANCE_ROUTES) {
    test(`${route.path} fits iPad landscape without overflow`, async ({ page }) => {
      await page.setViewportSize(iPadLandscape);
      await assertGovernancePage(page, route.path, route.heading);
    });

    test(`${route.path} fits iPad portrait without overflow`, async ({ page }) => {
      await page.setViewportSize(iPadPortrait);
      await assertGovernancePage(page, route.path, route.heading);
    });
  }

  test('projects page on Android tablet landscape with coarse pointer', async ({ page }) => {
    await page.setViewportSize(androidTabletLandscape);
    await emulateCoarsePointer(page);
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /your projects/i })).toBeVisible({ timeout: 30_000 });
    await assertNoHorizontalOverflow(page);
    await assertTouchTargets(page, GOVERNANCE_TOUCH_SELECTORS);
  });
});

test.describe('Cast viewer device layout', () => {
  test('cast viewer header controls meet touch targets on iPad portrait', async ({ page }) => {
    await page.setViewportSize(iPadPortrait);
    await page.goto('/cast/e2e-preview-token');
    await expect(page.getByTestId('cast-viewer-page')).toBeVisible({ timeout: 15_000 });
    await assertTouchTargets(page, ['.vish-cast-viewer-controls label', '.vish-cast-viewer-controls button']);
  });

  test('cast viewer fits iPhone portrait without horizontal overflow', async ({ page }) => {
    await page.setViewportSize(iPhonePortrait);
    await page.goto('/cast/e2e-preview-token');
    await expect(page.getByTestId('cast-viewer-page')).toBeVisible({ timeout: 15_000 });
    await assertNoHorizontalOverflow(page);
  });
});
