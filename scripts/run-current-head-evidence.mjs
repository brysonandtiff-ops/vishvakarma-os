#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const candidateSha = 'd93ae40493e2d54b16706bb54552c7e5e59cbc27';
const result = spawnSync('pnpm', ['run', 'launch:evidence:strict'], {
  cwd: process.cwd(),
  env: { ...process.env, CI: '1' },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 8 * 60_000,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

await mkdir('dist', { recursive: true });
const payload = {
  status: result.status === 0 ? 'PASS' : 'FAIL',
  phase: 'strict-evidence',
  candidateSha,
  completedAt: new Date().toISOString(),
  exitCode: result.status,
};
await writeFile('dist/certification-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
await writeFile('dist/index.html', `<pre>${JSON.stringify(payload, null, 2)}</pre>`, 'utf8');

if (result.status !== 0) process.exit(result.status ?? 1);
