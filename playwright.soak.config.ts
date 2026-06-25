import { defineConfig, devices } from "@playwright/test";

const soakMs = Number(process.env.VISH_SOAK_MS ?? "60000");
const timeoutMs = Number(process.env.VISH_SOAK_TIMEOUT_MS ?? String(soakMs + 60000));

export default defineConfig({
  testDir: "./e2e",
  testMatch: /long-session-soak-proof\.spec\.ts/,
  timeout: timeoutMs,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm exec vite preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
