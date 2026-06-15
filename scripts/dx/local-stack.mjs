#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { parseArgs, pass, fail, info } from '../lib/cli.mjs';
import { runCommand } from '../lib/run-command.mjs';

const root = process.cwd();

function spawnDetached(command, args, env = process.env) {
  return spawn(command, args, {
    cwd: root,
    env,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    detached: true,
  });
}

async function waitForUrl(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status < 500) return true;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const { flags } = parseArgs();
  const withCollab = !flags.has('no-collab');

  info('Starting local Vishvakarma.OS stack...');
  const dev = spawnDetached('pnpm', ['run', 'dev']);
  let collab = null;
  if (withCollab) {
    collab = spawnDetached('pnpm', ['run', 'collab:server:dev']);
  }

  try {
    await waitForUrl('http://127.0.0.1:5173');
    pass('dev-server', 'http://127.0.0.1:5173');

    if (withCollab) {
      const collabPort = process.env.COLLAB_WS_PORT ?? '1234';
      await waitForUrl(`http://127.0.0.1:${collabPort}`);
      pass('collab-server', `http://127.0.0.1:${collabPort}`);
    }

    runCommand('node scripts/stability/probe-health.mjs --url=http://127.0.0.1:5173', {
      stdio: 'inherit',
    });
    pass('local-stack', 'health probes passed — dev processes running in background');
    info('Stop background processes manually when finished (dev + collab).');
  } catch (error) {
    dev.kill('SIGTERM');
    collab?.kill('SIGTERM');
    fail('local-stack', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  fail('local-stack', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
