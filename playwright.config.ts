import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

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
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-gate',
      testMatch: [
        '**/auth-gate.spec.ts',
        '**/auth-private-routes.spec.ts',
        '**/ipad-production-readiness.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'] },
      webServer: {
        command: 'pnpm run preview',
        url: previewUrl,
        reuseExistingServer,
        timeout: 180_000,
        env: authGateServerEnv,
      },
    },
    {
      name: 'app-smoke',
      testMatch: [
        '**/ipad-editor-layout.spec.ts',
        '**/governance-smoke.spec.ts',
        '**/editor-features.spec.ts',
        '**/marketing-pages.spec.ts',
        '**/workspace-navigation.spec.ts',
        '**/projects-profile.spec.ts',
      ],
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
      name: 'screenshot-pack',
      testMatch: ['**/release-screenshot-pack.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
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
  ],
});
