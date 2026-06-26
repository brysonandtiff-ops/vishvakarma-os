import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /governance-smoke\.spec\.ts/,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    hasTouch: true,
    viewport: { width: 1080, height: 810 },
  },
  webServer: {
    command: "pnpm run preview:e2e:local",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  workers: 1,
});
