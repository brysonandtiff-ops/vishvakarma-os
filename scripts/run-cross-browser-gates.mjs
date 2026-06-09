#!/usr/bin/env node
/** Cross-browser smoke with stable preview; WebKit skipped on Windows (Playwright limitation). */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = ['--project=cross-browser-firefox'];

if (process.platform !== 'win32') {
  args.push('--project=cross-browser-webkit');
} else {
  console.log('Note: WebKit cross-browser smoke is skipped on Windows; run on Linux/macOS or in CI for Safari coverage.');
}

const child = spawn('node', ['scripts/run-local-preview-playwright.mjs', ...args], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 1));
