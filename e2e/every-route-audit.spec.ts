import { expect, test, type Page } from '@playwright/test';

type RouteContract = {
  name: string;
  path: string;
  ready: (page: Page) => Promise<void>;
};

const devices = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'ipad-landscape', viewport: { width: 1180, height: 820 } },
  { name: 'phone-portrait', viewport: { width: 390, height: 844 } },
] as const;

async function visibleHeading(page: Page, name: RegExp) {
  await expect(page.getByRole('heading', { name }).first()).toBeVisible({ timeout: 45_000 });
}

async function visiblePageShell(page: Page) {
  await expect(page.locator('body')).toBeVisible();
  await expect
    .poll(
      async () =>
        page.locator('h1:visible, h2:visible, main:visible, [data-testid$="-page"]:visible').count(),
      { timeout: 45_000 },
    )
    .toBeGreaterThan(0);
}

const routes: RouteContract[] = [
  {
    name: 'Landing',
    path: '/',
    ready: (page) => visibleHeading(page, /draw floor plans.*review in 3d.*export proof/i),
  },
  {
    name: 'Features',
    path: '/features',
    ready: (page) => visibleHeading(page, /interactive guides|full feature reference/i),
  },
  {
    name: 'Pricing',
    path: '/pricing',
    ready: async (page) => {
      const pricing = page.getByRole('heading', {
        name: /professional-grade tools|fair, predictable pricing/i,
      });
      const notFound = page.getByRole('heading', { name: /404|not found|route not found/i });
      await expect(pricing.first().or(notFound.first())).toBeVisible({ timeout: 45_000 });
    },
  },
  {
    name: 'Authentication',
    path: '/auth',
    ready: async (page) => {
      await expect(page.getByTestId('auth-page')).toBeVisible({ timeout: 45_000 });
      await expect(page.getByTestId('google-sso-button')).toBeVisible();
    },
  },
  {
    name: 'Reset password',
    path: '/reset-password',
    ready: visiblePageShell,
  },
  {
    name: 'Akasha Cast viewer',
    path: '/cast/e2e-page-audit',
    ready: async (page) => {
      await expect(page.getByTestId('cast-viewer-page')).toBeVisible({ timeout: 45_000 });
      await expect(page.getByRole('button', { name: /toggle sidebar/i })).toBeVisible();
    },
  },
  {
    name: 'Blueprint editor',
    path: '/editor',
    ready: async (page) => {
      await expect(page.getByTestId('editor-top-bar')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('blueprint-canvas')).toBeVisible({ timeout: 45_000 });
    },
  },
  {
    name: 'Lite editor',
    path: '/editor-lite',
    ready: async (page) => {
      await expect(page.getByTestId('lite-editor-page')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('lite-blueprint-canvas')).toBeVisible({ timeout: 45_000 });
    },
  },
  {
    name: '3D Room',
    path: '/3d-room',
    ready: async (page) => {
      await expect(page.getByText('Market-class 3D Room', { exact: true })).toBeVisible({ timeout: 60_000 });
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    },
  },
  {
    name: 'Projects',
    path: '/projects',
    ready: (page) => visibleHeading(page, /your projects/i),
  },
  {
    name: 'Profile',
    path: '/profile',
    ready: (page) => visibleHeading(page, /^profile$/i),
  },
  {
    name: 'Optimization',
    path: '/optimization',
    ready: (page) => visibleHeading(page, /design battle/i),
  },
  {
    name: 'Spec Center',
    path: '/spec-center',
    ready: (page) => visibleHeading(page, /spec center/i),
  },
  {
    name: 'Registry',
    path: '/registry',
    ready: (page) => visibleHeading(page, /registry center/i),
  },
  {
    name: 'Change Requests',
    path: '/change-requests',
    ready: (page) => visibleHeading(page, /change requests/i),
  },
  {
    name: 'Releases',
    path: '/releases',
    ready: (page) => visibleHeading(page, /release center/i),
  },
  {
    name: 'World Records',
    path: '/world-records',
    ready: (page) => visibleHeading(page, /world record registry/i),
  },
  {
    name: 'Audit Log',
    path: '/audit',
    ready: (page) => visibleHeading(page, /audit log/i),
  },
  {
    name: 'Marketing 404',
    path: '/404',
    ready: (page) => visibleHeading(page, /404|not found|route not found/i),
  },
  {
    name: 'Unknown route fallback',
    path: '/page-audit-route-does-not-exist',
    ready: (page) => visibleHeading(page, /404|not found|route not found/i),
  },
];

const ignoredConsoleErrors = [
  /favicon/i,
  /failed to load resource.*404/i,
  /webgl/i,
  /gpu/i,
  /cast.*connection/i,
  /unexpected token.*doctype/i,
];

for (const route of routes) {
  for (const device of devices) {
    test(`${route.name} [${device.name}]`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      await page.setViewportSize(device.viewport);
      await page.addInitScript(() => {
        window.localStorage.setItem('vishvakarma-analytics-consent', 'denied');
        window.localStorage.setItem('vishvakarma.os.onboardingDismissed.v1', '1');
        window.localStorage.setItem('vishvakarma.os.tutorialDismissed.v1', '1');
      });

      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (!ignoredConsoleErrors.some((pattern) => pattern.test(text))) consoleErrors.push(text);
      });

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      expect(response?.status() ?? 200, `${route.path} returned a server error`).toBeLessThan(500);
      await route.ready(page);

      await expect(page.getByText(/application error|something went wrong|workspace failed to render/i)).toHaveCount(0);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          overflow: doc.scrollWidth > doc.clientWidth + 2,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });
      expect(overflow.overflow, `Horizontal overflow ${overflow.scrollWidth}px > ${overflow.clientWidth}px`).toBe(false);

      expect(pageErrors, `Page errors: ${pageErrors.join(' | ')}`).toEqual([]);
      expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toEqual([]);

      await testInfo.attach(`${route.name}-${device.name}`, {
        body: await page.screenshot({ fullPage: false }),
        contentType: 'image/png',
      });
    });
  }
}
