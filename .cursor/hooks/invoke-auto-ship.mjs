#!/usr/bin/env node

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRepoRootFromHook } from '../../scripts/auto-ship/auto-ship-lib.mjs';
import { runAutoShip } from '../../scripts/auto-ship/auto-ship.mjs';

const hookDir = dirname(fileURLToPath(import.meta.url));

export function readStdinJson() {
  return new Promise((resolvePromise) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      if (!data.trim()) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(data));
      } catch {
        resolvePromise({});
      }
    });
  });
}

export function resolveRepoRoot() {
  return resolveRepoRootFromHook(hookDir, process.cwd());
}

export async function invokeAutoShip(args) {
  const repoRoot = resolveRepoRoot();
  if (!repoRoot) {
    return { ok: true, skipped: true, reason: 'no-git-root' };
  }

  const argv = [`--trigger=${args.trigger}`, `--cwd=${repoRoot}`];
  if (args.command) argv.push(`--command=${args.command}`);
  if (typeof args.exitCode === 'number') argv.push(`--exit-code=${args.exitCode}`);
  if (args.dryRun) argv.push('--dry-run');

  return runAutoShip(argv);
}
