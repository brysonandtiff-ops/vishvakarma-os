import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const appSmoke = base.projects?.find((project) => project.name === 'app-smoke-chromium');
if (!appSmoke) throw new Error('Missing Chromium app-smoke project for editor tests');

const localPreview = 'http://127.0.0.1:4173';

export default defineConfig({
  ...base,
  projects: [{ ...appSmoke, testMatch: '**/ipad-editor-current-contract.spec.ts' }],
  use: { ...base.use, baseURL: localPreview },
  webServer: {
    command: 'pnpm run preview:e2e:local',
    url: localPreview,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
