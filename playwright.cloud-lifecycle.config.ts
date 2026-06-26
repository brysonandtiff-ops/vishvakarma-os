import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /cloud-supabase-lifecycle\.spec\.ts/,
  timeout: 30_000,
  workers: 1,
});
