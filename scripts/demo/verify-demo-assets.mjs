#!/usr/bin/env node
/**
 * Verify that the Vishvakarma.OS 2-minute demo media pack has been captured.
 *
 * This is intentionally read-only. It does not generate screenshots; run:
 *   pnpm run test:screenshots
 * first, then run this verifier.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DEMO_DOC = 'docs/demo/VISHVAKARMA_OS_2_MIN_DEMO_FLOW.md';
const SCREENSHOT_DIR = 'docs/demo/screenshots';

const EXPECTED_SCREENSHOTS = [
  '01-landing.png',
  '02-projects-demo-cards.png',
  '03-editor-2d-demo-blueprint.png',
  '04-editor-3d-preview.png',
  '05-ai-copilot-proof-flow.png',
  '06-export-preview.png',
];

function fileStatus(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    return { path: relativePath, exists: false, bytes: 0 };
  }

  const stats = statSync(absolutePath);
  return { path: relativePath, exists: true, bytes: stats.size };
}

const requiredFiles = [
  DEMO_DOC,
  ...EXPECTED_SCREENSHOTS.map((name) => `${SCREENSHOT_DIR}/${name}`),
];

const statuses = requiredFiles.map(fileStatus);
const missing = statuses.filter((status) => !status.exists);
const empty = statuses.filter((status) => status.exists && status.bytes <= 0);

console.log('Vishvakarma.OS demo media pack verification');
console.log('------------------------------------------------');
for (const status of statuses) {
  const label = status.exists ? `${status.bytes.toLocaleString()} bytes` : 'missing';
  console.log(`${status.exists ? '✓' : '✗'} ${status.path} — ${label}`);
}

if (missing.length > 0 || empty.length > 0) {
  console.error('\nDemo media pack is incomplete.');
  if (missing.length > 0) {
    console.error(`Missing: ${missing.map((status) => status.path).join(', ')}`);
  }
  if (empty.length > 0) {
    console.error(`Empty: ${empty.map((status) => status.path).join(', ')}`);
  }
  console.error('\nNext step: run `pnpm run test:screenshots`, then run this verifier again.');
  process.exit(1);
}

console.log('\nDemo media pack is complete. Ready for pitch deck, listing, or investor walkthrough use.');
