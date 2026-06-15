import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';
const htmlReportFolder = process.env.PLAYWRIGHT_HTML_REPORT ?? 'playwright-report';

const authGateServerEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  VITE_E2E_ALLOW_LOCAL_ACCESS: '',
};

const appSmokeServerEnv = {
  ...authGateServerEnv,
  VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
};

const AUTH_GATE_MATCH = [
  '**/auth-gate.spec.ts',
  '**/auth-private-routes.spec.ts',
  '**/auth-post-login-restore.spec.ts',
  '**/ipad-production-readiness.spec.ts',
];

const APP_SMOKE_MATCH = [
  '**/ipad-editor-layout.spec.ts',
  '**/device-governance-layout.spec.ts',
  '**/device-marketing-layout.spec.ts',
  '**/device-phone-editor.spec.ts',
  '**/device-collaboration-chrome.spec.ts',
  '**/device-desktop-layout.spec.ts',
  '**/governance-smoke.spec.ts',
  '**/editor-features.spec.ts',
  '**/marketing-pages.spec.ts',
  '**/workspace-navigation.spec.ts',
  '**/projects-profile.spec.ts',
  '**/optimization.spec.ts',
  '**/ai-designer.spec.ts',
  '**/collaboration-sync.spec.ts',
  '**/compliance-gate.spec.ts',
  '**/akasha-cast.spec.ts',
];

const CROSS_BROWSER_SMOKE_MATCH = ['**/cross-browser-smoke.spec.ts'];

const BROWSERS = [
  { slug: 'chromium', device: 'Desktop Chrome' as const },
  { slug: 'firefox', device: 'Desktop Firefox' as const },
  { slug: 'webkit', device: 'Desktop Safari' as const },
];

const browserMatrixProjects = BROWSERS.flatMap((browser) => [
  {
    name: `auth-gate-${browser.slug}`,
    testMatch: AUTH_GATE_MATCH,
    use: { ...devices[browser.device] },
    webServer: {
      command: 'pnpm run preview:e2e',
      url: previewUrl,
      reuseExistingServer,
      timeout: 300_000,
      env: authGateServerEnv,
    },
  },
  {
    name: `app-smoke-${browser.slug}`,
    testMatch: APP_SMOKE_MATCH,
    use: { ...devices[browser.device], hasTouch: true },
    webServer: {
      command: 'pnpm run preview:e2e:local',
      url: previewUrl,
      reuseExistingServer,
      timeout: 300_000,
      env: appSmokeServerEnv,
    },
  },
  {
    name: `cross-browser-smoke-${browser.slug}`,
    testMatch: CROSS_BROWSER_SMOKE_MATCH,
    use: { ...devices[browser.device], hasTouch: true },
    webServer: {
      command: 'pnpm run preview:e2e:local',
      url: previewUrl,
      reuseExistingServer,
      timeout: 300_000,
      env: appSmokeServerEnv,
    },
  },
]);

const chromiumAuthGate = browserMatrixProjects.find((project) => project.name === 'auth-gate-chromium')!;
const chromiumAppSmoke = browserMatrixProjects.find((project) => project.name === 'app-smoke-chromium')!;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: htmlReportFolder, open: 'never' }]]
    : [['list']],
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    ...browserMatrixProjects,
    { ...chromiumAuthGate, name: 'auth-gate' },
    { ...chromiumAppSmoke, name: 'app-smoke' },
    {
      name: 'screenshot-pack',
      testMatch: ['**/release-screenshot-pack.spec.ts', '**/marketing-asset-pack.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
      },
      webServer: {
        command: 'pnpm run preview:e2e:local',
        url: previewUrl,
        reuseExistingServer,
        timeout: 300_000,
        env: appSmokeServerEnv,
      },
    },
    {
      name: 'page-reference-pack',
      testMatch: ['**/page-reference-pack.spec.ts', '**/page-reference-pack-remainder.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
      },
    },
    {
      name: 'accessibility-audit',
      testMatch: ['**/accessibility-audit.spec.ts'],
      use: { ...devices['Desktop Chrome'], hasTouch: true },
      webServer: {
        command: 'pnpm run preview:e2e:local',
        url: previewUrl,
        reuseExistingServer,
        timeout: 300_000,
        env: appSmokeServerEnv,
      },
    },
    {
      name: 'editor-performance',
      testMatch: ['**/editor-performance.spec.ts'],
      use: { ...devices['Desktop Chrome'], hasTouch: true },
      webServer: {
        command: 'pnpm run preview:e2e:local',
        url: previewUrl,
        reuseExistingServer,
        timeout: 300_000,
        env: appSmokeServerEnv,
      },
    },
  ],
});
