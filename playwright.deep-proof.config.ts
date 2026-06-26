import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    /editor-tool-clickthrough-proof\.spec\.ts/,
    /editor-draw-workflow-proof\.spec\.ts/,
    /project-demo-load-proof\.spec\.ts/,
  ],
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm run preview:e2e:local",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
