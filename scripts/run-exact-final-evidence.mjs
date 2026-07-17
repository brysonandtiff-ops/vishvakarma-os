#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const candidateSha = '5822cb04d12238d30c3695d6f6e98579aa6977ba';
const result = spawnSync('pnpm', ['run', 'launch:evidence:strict'], {
  cwd: process.cwd(),
  env: { ...process.env, CI: '1' },
  stdio: 'inherit',
  shell: true,
});

const payload = {
  status: result.status === 0 ? 'PASS' : 'FAIL',
  phase: 'strict-evidence',
  candidateSha,
  completedAt: new Date().toISOString(),
  exitCode: result.status,
};

await mkdir('dist', { recursive: true });
await writeFile('dist/certification-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
await writeFile('dist/index.html', `<pre>${JSON.stringify(payload, null, 2)}</pre>`, 'utf8');

if (result.status !== 0) process.exit(1);
