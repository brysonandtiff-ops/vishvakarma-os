#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    fail(`${label} is missing required phrase: ${phrase}`);
  }
}

const mainTsx = readRequired('src/main.tsx');
requirePhrase(mainTsx, './ipad-workspace.css', 'main.tsx device workspace import');

const layoutTokens = readRequired('src/styles/vish-layout-tokens.css');
requirePhrase(layoutTokens, '--vish-phone-max:', 'vish-layout-tokens.css');
requirePhrase(layoutTokens, '--vish-tablet-min:', 'vish-layout-tokens.css');

const indexHtml = readRequired('index.html');
requirePhrase(indexHtml, 'viewport-fit=cover', 'index.html viewport');
requirePhrase(indexHtml, 'interactive-widget=resizes-content', 'index.html keyboard resize');

const marketingCss = readRequired('src/styles/vish-marketing.css');
requirePhrase(marketingCss, '@media (pointer: coarse)', 'vish-marketing.css coarse pointer rules');
requirePhrase(marketingCss, 'max-width: 1194px', 'vish-marketing.css tablet touch rules');

const requiredE2E = [
  'e2e/device-governance-layout.spec.ts',
  'e2e/device-marketing-layout.spec.ts',
  'e2e/device-phone-editor.spec.ts',
  'e2e/device-collaboration-chrome.spec.ts',
  'e2e/device-desktop-layout.spec.ts',
  'e2e/deviceTouchTargets.ts',
];

for (const spec of requiredE2E) {
  if (!existsSync(join(root, spec))) {
    fail(`Missing device hardening E2E file: ${spec}`);
  }
}

const evidenceDoc = join(root, 'docs/release/evidence/device-hardening-audit.md');
if (!existsSync(evidenceDoc)) {
  fail('Missing docs/release/evidence/device-hardening-audit.md');
}

const runbook = join(root, 'docs/release/DEVICE_HARDENING_RUNBOOK.md');
if (!existsSync(runbook)) {
  fail('Missing docs/release/DEVICE_HARDENING_RUNBOOK.md');
}

if (failures.length > 0) {
  console.error('[device-hardening:gates] FAILED');
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log('[device-hardening:gates] PASS — device workspace CSS, marketing coarse rules, and E2E specs present');
