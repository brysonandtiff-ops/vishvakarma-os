import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';
const htmlReportFolder = process.env.PLAYWRIGHT_HTML_REPORT ?? 'playwright-report-qe-route-smoke';

const serverEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/qe-production-route-smoke.spec.ts'],
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: htmlReportFolder, open: 'never' }]]
    : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm run preview:e2e:local',
    url: previewUrl,
    reuseExistingServer,
    timeout: 300_000,
    env: serverEnv,
  },
});
