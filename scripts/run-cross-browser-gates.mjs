#!/usr/bin/env node
/** Full auth-gate + app-smoke matrix on chromium, firefox, and webkit. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn('node', ['scripts/run-e2e-gates.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS: 'all',
  },
});

child.on('exit', (code) => process.exit(code ?? 1));
