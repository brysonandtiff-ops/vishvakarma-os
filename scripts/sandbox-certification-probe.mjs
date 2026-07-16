#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = `vish-chroot-probe-${Date.now()}`;
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function run(args, { allowFailure = false, timeoutMs = 5 * 60_000 } = {}) {
  console.log(`[sandbox-probe] pnpm ${args.join(' ')}`);
  const result = spawnSync('pnpm', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VERCEL_TOKEN: oidcToken ?? '',
      VERCEL_TEAM_ID: teamId,
      VERCEL_PROJECT_ID: projectId,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}: pnpm ${args.join(' ')}`);
  }
  return result;
}

async function writeArtifact(status) {
  await mkdir('dist', { recursive: true });
  await writeFile(
    'dist/index.html',
    `<!doctype html><html><body><h1>Sandbox Chroot Probe</h1><pre>${status}</pre></body></html>`,
    'utf8',
  );
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN is unavailable.');
  let created = false;
  try {
    run(['dlx', 'sandbox', 'create', '--name', sandboxName, '--runtime', 'node24', '--timeout', '10m']);
    created = true;
    run([
      'dlx',
      'sandbox',
      'exec',
      '--sudo',
      '--timeout',
      '5m',
      sandboxName,
      '--',
      'bash',
      '-lc',
      "set -euo pipefail; chroot / /bin/bash -lc 'echo CHROOT_PASS'; mkdir -p /tmp/vish-mount-probe; mount -t tmpfs tmpfs /tmp/vish-mount-probe; mountpoint /tmp/vish-mount-probe; umount /tmp/vish-mount-probe; rmdir /tmp/vish-mount-probe; echo MOUNT_PASS",
    ]);
    await writeArtifact('PASS: chroot and mount capabilities verified.');
  } finally {
    if (created) {
      run(['dlx', 'sandbox', 'stop', sandboxName], { allowFailure: true });
      run(['dlx', 'sandbox', 'remove', sandboxName], { allowFailure: true });
    }
  }
}

main().catch(async (error) => {
  console.error('[sandbox-probe] FAIL:', error instanceof Error ? error.message : String(error));
  await writeArtifact(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
