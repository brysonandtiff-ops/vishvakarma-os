#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = `vish-production-cert-${Date.now()}`;
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const candidateSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || 'unknown';
const sourceArchive = '/tmp/vish-production-cert-source.tgz';
const resultFile = '/tmp/vish-production-cert-result.json';
const craneVersion = 'v0.20.3';

function sandboxArgs(args) {
  return ['dlx', 'sandbox', ...args];
}

function run(program, args, { allowFailure = false, timeoutMs = 20 * 60_000 } = {}) {
  console.log(`[production-cert] ${[program, ...args].join(' ')}`);
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
    throw new Error(`Command failed with exit code ${result.status}: ${[program, ...args].join(' ')}`);
  }
  return result;
}

function sandbox(args, options = {}) {
  return run('pnpm', sandboxArgs(args), options);
}

async function createSourceArchive() {
  run('tar', [
    '--exclude=.git',
    '--exclude=node_modules',
    '--exclude=dist',
    '--exclude=coverage',
    '--exclude=playwright-report',
    '--exclude=test-results',
    '--exclude=.vercel',
    '-czf',
    sourceArchive,
    '.',
  ], { timeoutMs: 5 * 60_000 });
}

function cleanupSandbox() {
  const unmount = [
    'umount -l /opt/ubuntu/proc 2>/dev/null || true',
    'umount -l /opt/ubuntu/sys 2>/dev/null || true',
    'umount -l /opt/ubuntu/dev/pts 2>/dev/null || true',
    'umount -l /opt/ubuntu/dev 2>/dev/null || true',
  ].join('; ');
  sandbox(['exec', '--sudo', '--timeout', '2m', sandboxName, '--', 'bash', '-lc', unmount], {
    allowFailure: true,
    timeoutMs: 3 * 60_000,
  });
  sandbox(['stop', sandboxName], { allowFailure: true, timeoutMs: 2 * 60_000 });
  sandbox(['remove', sandboxName], { allowFailure: true, timeoutMs: 2 * 60_000 });
}

async function writeDeploymentArtifact(result) {
  await mkdir('dist', { recursive: true });
  await writeFile('dist/certification-result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await writeFile(
    'dist/index.html',
    `<!doctype html><html><body><h1>Vishvakarma.OS Production Certification</h1><pre>${JSON.stringify(result, null, 2)}</pre></body></html>`,
    'utf8',
  );
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN is unavailable; Sandbox cannot authenticate.');

  await createSourceArchive();
  let created = false;
  try {
    sandbox([
      'create', '--name', sandboxName, '--runtime', 'node24', '--timeout', '1h',
      '--vcpus', '4', '--network-policy', 'allow-all',
    ]);
    created = true;
    sandbox(['copy', sourceArchive, `${sandboxName}:/tmp/source.tgz`], { timeoutMs: 10 * 60_000 });

    const setupUbuntu = [
      'set -euo pipefail',
      `curl -fsSL https://github.com/google/go-containerregistry/releases/download/${craneVersion}/go-containerregistry_Linux_x86_64.tar.gz -o /tmp/crane.tgz`,
      'tar -xzf /tmp/crane.tgz -C /usr/local/bin crane',
      'chmod 0755 /usr/local/bin/crane',
      'rm -rf /opt/ubuntu',
      'mkdir -p /opt/ubuntu',
      'crane export ubuntu:24.04 - | tar -x -C /opt/ubuntu',
      'mkdir -p /opt/ubuntu/proc /opt/ubuntu/sys /opt/ubuntu/dev/pts /opt/ubuntu/app',
      'cp --remove-destination /etc/resolv.conf /opt/ubuntu/etc/resolv.conf',
      'cp --remove-destination /etc/hosts /opt/ubuntu/etc/hosts',
      'mount -t proc proc /opt/ubuntu/proc',
      'mount --rbind /sys /opt/ubuntu/sys',
      'mount --make-rslave /opt/ubuntu/sys',
      'mount --rbind /dev /opt/ubuntu/dev',
      'mount --make-rslave /opt/ubuntu/dev',
      'tar -xzf /tmp/source.tgz -C /opt/ubuntu/app',
    ].join('; ');
    sandbox(['exec', '--sudo', '--timeout', '15m', sandboxName, '--', 'bash', '-lc', setupUbuntu], {
      timeoutMs: 18 * 60_000,
    });

    const installToolchain = [
      'set -euo pipefail',
      'export DEBIAN_FRONTEND=noninteractive',
      'apt-get update',
      'apt-get install -y --no-install-recommends ca-certificates curl git xz-utils',
      'curl -fsSL https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-x64.tar.xz -o /tmp/node.tar.xz',
      'tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1',
      'corepack enable',
      'corepack prepare pnpm@9.15.0 --activate',
      'cd /app',
      'pnpm install --frozen-lockfile',
      'pnpm exec playwright install --with-deps chromium firefox webkit',
    ].join('; ');
    sandbox([
      'exec', '--sudo', '--timeout', '25m', sandboxName, '--',
      'chroot', '/opt/ubuntu', '/bin/bash', '-lc', installToolchain,
    ], { timeoutMs: 28 * 60_000 });

    const certify = [
      'set -euo pipefail',
      'cd /app',
      'export CI=1',
      'export VITE_E2E_ALLOW_LOCAL_ACCESS=true',
      'export VITE_ALLOW_LOCAL_DEMO=true',
      'export PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth',
      'pnpm run test:e2e',
      'pnpm run test:e2e:cross-browser',
      'pnpm run test:e2e:a11y',
      'pnpm run test:e2e:perf',
      'pnpm run verify:production-auth-flow',
      'pnpm run release:gates:strict',
      'pnpm run launch:evidence:strict',
      `node -e "const fs=require('fs'); fs.writeFileSync('docs/release/evidence/sandbox-production-certification-result.json', JSON.stringify({status:'PASS',sha:'${candidateSha}',completedAt:new Date().toISOString()},null,2)+'\\n')"`,
    ].join('; ');
    sandbox([
      'exec', '--sudo', '--timeout', '55m', sandboxName, '--',
      'chroot', '/opt/ubuntu', '/bin/bash', '-lc', certify,
    ], { timeoutMs: 58 * 60_000 });

    sandbox([
      'copy',
      `${sandboxName}:/opt/ubuntu/app/docs/release/evidence/sandbox-production-certification-result.json`,
      resultFile,
    ]);
    const result = JSON.parse(await readFile(resultFile, 'utf8'));
    await writeDeploymentArtifact(result);
    console.log(`[production-cert] PASS — exact-SHA certification completed for ${candidateSha}.`);
  } finally {
    if (created) cleanupSandbox();
    await rm(sourceArchive, { force: true });
    await rm(resultFile, { force: true });
  }
}

main().catch(async (error) => {
  const result = {
    status: 'FAIL',
    sha: candidateSha,
    completedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  };
  console.error('[production-cert] FAIL:', result.error);
  await writeDeploymentArtifact(result);
  await rm(sourceArchive, { force: true });
  await rm(resultFile, { force: true });
  process.exit(1);
});
