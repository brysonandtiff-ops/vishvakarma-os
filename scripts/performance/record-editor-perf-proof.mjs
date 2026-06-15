#!/usr/bin/env node
/**
 * Runs the editor performance overhaul mock audit and refreshes evidence artifacts.
 * Usage: node scripts/performance/record-editor-perf-proof.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const proofPath = join(root, 'docs', 'release', 'evidence', 'editor-performance-overhaul-proof.json');

console.log('Running editor performance overhaul mock audit...');
execSync('pnpm exec vitest run src/test/editorPerformanceOverhaul.test.ts', {
  stdio: 'inherit',
  cwd: root,
  shell: true,
});

const proof = JSON.parse(readFileSync(proofPath, 'utf8'));
console.log('\n--- Editor performance overhaul proof ---');
console.log(`Commit: ${proof.commitSha}`);
console.log(`Pass: ${proof.summary.pass}  Fail: ${proof.summary.fail}  Warn: ${proof.summary.warn}  Total: ${proof.summary.total}`);
console.log(`JSON: docs/release/evidence/editor-performance-overhaul-proof.json`);
console.log(`Markdown: docs/release/evidence/editor-performance-overhaul-proof.md`);

if (proof.summary.fail > 0) {
  process.exitCode = 1;
}
