import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.IPAD10_PROOF_BASE_URL ?? 'https://vishvakarma-os.app';
const htmlReportFolder = process.env.PLAYWRIGHT_HTML_REPORT ?? 'playwright-report-ipad10';

const ipad10SafariLike = {
  ...devices['Desktop Safari'],
  viewport: { width: 1180, height: 820 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: htmlReportFolder, open: 'never' }]]
    : [['list'], ['html', { outputFolder: htmlReportFolder, open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'ipad-10-live-landscape',
      testMatch: ['**/ipad10-production-proof.spec.ts'],
      use: ipad10SafariLike,
    },
  ],
});
