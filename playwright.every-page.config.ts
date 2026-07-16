import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/every-route-audit.spec.ts'],
  timeout: 120_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['./scripts/every-page-reporter.mjs'],
    ['html', { outputFolder: 'playwright-every-page-report', open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: previewUrl,
    hasTouch: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm run preview:e2e:local',
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...process.env,
      VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
      VITE_ALLOW_LOCAL_DEMO: 'true',
    },
  },
});
