import { defineConfig, devices } from '@playwright/test';

/**
 * Full QE audit config: captures screenshots, video and traces for every test
 * (not just failures) so the run produces a complete hand-off evidence pack.
 *
 * Run via scripts/run-local-preview-playwright.mjs so the e2e-local preview
 * server is built, started and torn down around the run.
 */

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const evidenceRoot = process.env.QE_EVIDENCE_DIR ?? 'qe-audit-evidence';

const WORKFLOW_MATCH = [
  '**/full-customer-audit.spec.ts',
  '**/workspace-navigation.spec.ts',
  '**/marketing-pages.spec.ts',
  '**/projects-profile.spec.ts',
  '**/editor-features.spec.ts',
  '**/editor-draw-workflow-proof.spec.ts',
  '**/editor-tool-clickthrough-proof.spec.ts',
  '**/governance-smoke.spec.ts',
  '**/optimization.spec.ts',
  '**/ai-designer.spec.ts',
  '**/collaboration-sync.spec.ts',
  '**/compliance-gate.spec.ts',
  '**/akasha-cast.spec.ts',
  '**/tutorial-essentials.spec.ts',
  '**/project-demo-load-proof.spec.ts',
  '**/route-health-smoke.spec.ts',
];

const DEVICE_MATCH = [
  '**/device-desktop-layout.spec.ts',
  '**/device-marketing-layout.spec.ts',
  '**/device-governance-layout.spec.ts',
  '**/device-phone-editor.spec.ts',
  '**/device-collaboration-chrome.spec.ts',
  '**/device-validation-proof-panel.spec.ts',
  '**/ipad-editor-layout.spec.ts',
  '**/ipad-editor-workflow.spec.ts',
];

const SCREENSHOT_MATCH = [
  '**/release-screenshot-pack.spec.ts',
  '**/marketing-asset-pack.spec.ts',
  '**/demo-flow-screenshot-pack.spec.ts',
  '**/page-reference-pack.spec.ts',
  '**/page-reference-pack-remainder.spec.ts',
];

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  outputDir: `${evidenceRoot}/artifacts`,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${evidenceRoot}/html-report`, open: 'never' }],
    ['json', { outputFile: `${evidenceRoot}/results.json` }],
  ],
  use: {
    baseURL: previewUrl,
    trace: 'on',
    screenshot: 'on',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'workflows',
      testMatch: WORKFLOW_MATCH,
      use: { ...devices['Desktop Chrome'], hasTouch: true },
    },
    {
      name: 'devices',
      testMatch: DEVICE_MATCH,
      use: { ...devices['Desktop Chrome'], hasTouch: true },
    },
    {
      name: 'screens',
      testMatch: SCREENSHOT_MATCH,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
      },
    },
    {
      name: 'accessibility',
      testMatch: ['**/accessibility-audit.spec.ts'],
      use: { ...devices['Desktop Chrome'], hasTouch: true },
    },
  ],
});
