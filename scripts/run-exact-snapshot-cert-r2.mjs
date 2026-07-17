#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-exact-snapshot-cert.mjs', import.meta.url);
const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();
const generatedPath = '/tmp/vish-exact-cert-browser-r3.mjs';
let source = await readFile(sourcePath, 'utf8');

source = source
  .replace(
    "const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();",
    `const phase = ${JSON.stringify(phase)};`,
  )
  .replace(
    "auth: 'pnpm exec playwright test --project=auth-gate-chromium'",
    "auth: 'pnpm run test:e2e:auth'",
  )
  .replace(
    "editor: 'pnpm exec playwright test --project=app-smoke-chromium e2e/ipad-editor-layout.spec.ts e2e/ipad-editor-workflow.spec.ts e2e/ipad-editor-current-contract.spec.ts e2e/full-customer-audit.spec.ts e2e/editor-features.spec.ts'",
    "editor: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/ipad-editor-layout.spec.ts e2e/ipad-editor-workflow.spec.ts e2e/ipad-editor-current-contract.spec.ts e2e/full-customer-audit.spec.ts e2e/editor-features.spec.ts'",
  )
  .replace(
    "ui: 'pnpm exec playwright test --project=app-smoke-chromium e2e/device-governance-layout.spec.ts e2e/device-marketing-layout.spec.ts e2e/device-phone-editor.spec.ts e2e/device-collaboration-chrome.spec.ts e2e/device-desktop-layout.spec.ts e2e/governance-smoke.spec.ts e2e/marketing-pages.spec.ts e2e/overlay-exclusivity.spec.ts e2e/menu-overlap.spec.ts e2e/device-validation-proof-panel.spec.ts'",
    "ui: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/device-governance-layout.spec.ts e2e/device-marketing-layout.spec.ts e2e/device-phone-editor.spec.ts e2e/device-collaboration-chrome.spec.ts e2e/device-desktop-layout.spec.ts e2e/governance-smoke.spec.ts e2e/marketing-pages.spec.ts e2e/overlay-exclusivity.spec.ts e2e/menu-overlap.spec.ts e2e/device-validation-proof-panel.spec.ts'",
  )
  .replace(
    "services: 'pnpm exec playwright test --project=app-smoke-chromium e2e/workspace-navigation.spec.ts e2e/projects-profile.spec.ts e2e/optimization.spec.ts e2e/ai-designer.spec.ts e2e/collaboration-sync.spec.ts e2e/compliance-gate.spec.ts e2e/akasha-cast.spec.ts'",
    "services: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/workspace-navigation.spec.ts e2e/projects-profile.spec.ts e2e/optimization.spec.ts e2e/ai-designer.spec.ts e2e/collaboration-sync.spec.ts e2e/compliance-gate.spec.ts e2e/akasha-cast.spec.ts'",
  )
  .replace(
    "crossbrowser: 'pnpm exec playwright test --project=auth-gate-firefox && pnpm exec playwright test --project=cross-browser-smoke-firefox && pnpm exec playwright test --project=auth-gate-webkit && pnpm exec playwright test --project=cross-browser-smoke-webkit'",
    "crossbrowser: 'pnpm run test:e2e:cross-browser'",
  );

await writeFile(generatedPath, source, 'utf8');
await import(pathToFileURL(generatedPath).href);
