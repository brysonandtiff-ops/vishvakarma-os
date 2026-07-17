#!/usr/bin/env node

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const candidateSha = 'd93ae40493e2d54b16706bb54552c7e5e59cbc27';
const snapshotId = 'snap_jEsLVtxQ4CAvQeCRdbKAsPh565OG';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const archive = '/tmp/vish-current-crossbrowser-auth.tgz';
const sandboxName = `vish-current-crossbrowser-auth-${Date.now()}`;

function run(program, args, { allowFailure = false, timeoutMs = 20 * 60_000 } = {}) {
  const result = spawnSync(program, args, {
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
    const suffix = result.error?.code === 'ETIMEDOUT' ? ' timed out' : '';
    throw new Error(`${[program, ...args].join(' ')}${suffix}; exit ${result.status}`);
  }
  return result;
}

function sandbox(args, options = {}) {
  return run('pnpm', ['dlx', 'sandbox', ...args], options);
}

async function writeResult(result) {
  await mkdir('dist', { recursive: true });
  await writeFile('dist/certification-result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const escaped = JSON.stringify(result, null, 2).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  await writeFile('dist/index.html', `<pre>${escaped}</pre>`, 'utf8');
}

function cleanup() {
  sandbox(['exec', '--sudo', '--timeout', '90s', sandboxName, '--', 'bash', '-lc', 'umount -l /opt/ubuntu/proc 2>/dev/null || true; umount -l /opt/ubuntu/sys 2>/dev/null || true; umount -l /opt/ubuntu/dev/pts 2>/dev/null || true; umount -l /opt/ubuntu/dev 2>/dev/null || true'], { allowFailure: true, timeoutMs: 2 * 60_000 });
  sandbox(['stop', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
  sandbox(['remove', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');

  run('tar', ['--exclude=.git', '--exclude=node_modules', '--exclude=dist', '--exclude=coverage', '--exclude=playwright-report', '--exclude=test-results', '--exclude=.vercel', '-czf', archive, '.'], { timeoutMs: 4 * 60_000 });
  let created = false;
  try {
    sandbox(['create', '--name', sandboxName, '--snapshot', snapshotId, '--timeout', '40m', '--vcpus', '4', '--network-policy', 'allow-all'], { timeoutMs: 4 * 60_000 });
    created = true;
    sandbox(['copy', archive, `${sandboxName}:/tmp/source.tgz`], { timeoutMs: 4 * 60_000 });

    const refresh = [
      'set -euo pipefail',
      'mkdir -p /opt/ubuntu/proc /opt/ubuntu/sys /opt/ubuntu/dev/pts /opt/ubuntu/app',
      'mountpoint -q /opt/ubuntu/proc || mount -t proc proc /opt/ubuntu/proc',
      'mountpoint -q /opt/ubuntu/sys || mount --rbind /sys /opt/ubuntu/sys',
      'mount --make-rslave /opt/ubuntu/sys || true',
      'mountpoint -q /opt/ubuntu/dev || mount --rbind /dev /opt/ubuntu/dev',
      'mount --make-rslave /opt/ubuntu/dev || true',
      'cp --remove-destination /etc/resolv.conf /opt/ubuntu/etc/resolv.conf',
      'cp --remove-destination /etc/hosts /opt/ubuntu/etc/hosts',
      "find /opt/ubuntu/app -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +",
      'tar -xzf /tmp/source.tgz -C /opt/ubuntu/app',
    ].join('; ');
    sandbox(['exec', '--sudo', '--timeout', '4m', sandboxName, '--', 'bash', '-lc', refresh], { timeoutMs: 5 * 60_000 });

    const certify = [
      'set -euo pipefail',
      'cd /app',
      'corepack enable',
      'corepack prepare pnpm@9.15.0 --activate',
      'pnpm install --frozen-lockfile',
      'pnpm exec playwright install firefox webkit',
      'export CI=1',
      'export VITE_E2E_ALLOW_LOCAL_ACCESS=true',
      'export VITE_ALLOW_LOCAL_DEMO=true',
      'export PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth',
      'pnpm run test:e2e:cross-browser',
      'pnpm run verify:production-auth-flow',
    ].join('; ');
    sandbox(['exec', '--sudo', '--timeout', '30m', sandboxName, '--', 'chroot', '/opt/ubuntu', '/bin/bash', '-lc', certify], { timeoutMs: 32 * 60_000 });

    await writeResult({ status: 'PASS', phase: 'cross-browser-production-auth', candidateSha, completedAt: new Date().toISOString() });
  } finally {
    if (created) cleanup();
    await rm(archive, { force: true });
  }
}

main().catch(async (error) => {
  await writeResult({ status: 'FAIL', phase: 'cross-browser-production-auth', candidateSha, error: error instanceof Error ? error.message : String(error), completedAt: new Date().toISOString() });
  await rm(archive, { force: true });
  process.exit(1);
});
