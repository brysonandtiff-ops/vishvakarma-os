#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const candidateSha = '4b825fde0cd6abcb1305ce4e320d4e7296792358';
const phase = process.env.CERT_PHASE?.trim() || '';
const runnerSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || 'unknown';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const managementToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const sourceArchive = `/tmp/vish-cert-${phase}-source.tgz`;
const resultFile = `/tmp/vish-cert-${phase}-result.json`;
const sandboxName = `vish-cert-${phase}-${Date.now()}`;
const craneVersion = 'v0.20.3';

const PHASES = {
  chromium: {
    browsers: ['chromium'],
    hardenSupabase: true,
    commands: ['PLAYWRIGHT_BROWSERS=chromium node scripts/run-e2e-gates.mjs'],
  },
  firefox: {
    browsers: ['firefox'],
    hardenSupabase: false,
    commands: ['PLAYWRIGHT_BROWSERS=firefox node scripts/run-e2e-gates.mjs'],
  },
  webkit: {
    browsers: ['webkit'],
    hardenSupabase: false,
    commands: ['PLAYWRIGHT_BROWSERS=webkit node scripts/run-e2e-gates.mjs'],
  },
  quality: {
    browsers: ['chromium'],
    hardenSupabase: false,
    commands: [
      'pnpm run test:e2e:a11y',
      'pnpm run test:e2e:perf',
      'pnpm run verify:production-auth-flow',
    ],
  },
  release: {
    browsers: [],
    hardenSupabase: false,
    commands: [
      'pnpm run release:gates:strict',
      'pnpm run launch:evidence:strict',
    ],
  },
};

const config = PHASES[phase];

function sandboxArgs(args) {
  return ['dlx', 'sandbox', ...args];
}

function run(program, args, { allowFailure = false, timeoutMs = 15 * 60_000 } = {}) {
  console.log(`[cert:${phase}] ${[program, ...args].join(' ')}`);
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
    const timeoutNote = result.error?.code === 'ETIMEDOUT' ? ' (timed out)' : '';
    throw new Error(`Command failed${timeoutNote} with exit code ${result.status}: ${[program, ...args].join(' ')}`);
  }
  return result;
}

function sandbox(args, options = {}) {
  return run('pnpm', sandboxArgs(args), options);
}

async function writeDeploymentArtifact(result) {
  await mkdir('dist', { recursive: true });
  await writeFile('dist/certification-result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const escaped = JSON.stringify(result, null, 2)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  await writeFile(
    'dist/index.html',
    `<!doctype html><html><body><h1>Vishvakarma.OS ${phase} certification</h1><pre>${escaped}</pre></body></html>`,
    'utf8',
  );
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
  sandbox(['exec', '--sudo', '--timeout', '90s', sandboxName, '--', 'bash', '-lc', unmount], {
    allowFailure: true,
    timeoutMs: 2 * 60_000,
  });
  sandbox(['stop', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
  sandbox(['remove', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
}

async function main() {
  if (!config) throw new Error(`Unknown CERT_PHASE: ${phase || '(empty)'}`);
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN is unavailable; Sandbox cannot authenticate.');
  if (config.hardenSupabase && !managementToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN is unavailable for hosted Auth hardening.');
  }

  console.log(`[cert:${phase}] Candidate source SHA: ${candidateSha}`);
  console.log(`[cert:${phase}] Runner SHA: ${runnerSha}`);
  console.log(`[cert:${phase}] Commands: ${config.commands.join(' && ')}`);

  if (config.hardenSupabase) {
    run('pnpm', ['run', 'setup:supabase-auth:hardening'], { timeoutMs: 12 * 60_000 });
    console.log(`[cert:${phase}] Hosted Supabase Auth hardening passed.`);
  }

  await createSourceArchive();
  let created = false;
  try {
    sandbox([
      'create', '--name', sandboxName, '--runtime', 'node24', '--timeout', '40m',
      '--vcpus', '4', '--network-policy', 'allow-all',
    ]);
    created = true;
    sandbox(['copy', sourceArchive, `${sandboxName}:/tmp/source.tgz`], { timeoutMs: 8 * 60_000 });

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
    sandbox(['exec', '--sudo', '--timeout', '10m', sandboxName, '--', 'bash', '-lc', setupUbuntu], {
      timeoutMs: 12 * 60_000,
    });

    const browserInstall = config.browsers.length
      ? `pnpm exec playwright install --with-deps ${config.browsers.join(' ')}`
      : '';
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
      browserInstall,
    ].filter(Boolean).join('; ');
    sandbox([
      'exec', '--sudo', '--timeout', '16m', sandboxName, '--',
      'chroot', '/opt/ubuntu', '/bin/bash', '-lc', installToolchain,
    ], { timeoutMs: 18 * 60_000 });

    const artifactPath = `docs/release/evidence/sandbox-production-certification-${phase}.json`;
    const certify = [
      'set -euo pipefail',
      'cd /app',
      'export CI=1',
      'export VITE_E2E_ALLOW_LOCAL_ACCESS=true',
      'export VITE_ALLOW_LOCAL_DEMO=true',
      'export PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth',
      ...config.commands,
      `node -e "const fs=require('fs'); fs.writeFileSync('${artifactPath}', JSON.stringify({status:'PASS',phase:'${phase}',candidateSha:'${candidateSha}',runnerSha:'${runnerSha}',commands:${JSON.stringify(config.commands)},browsers:${JSON.stringify(config.browsers)},supabaseHardening:${config.hardenSupabase},completedAt:new Date().toISOString()},null,2)+'\\n')"`,
    ].join('; ');
    sandbox([
      'exec', '--sudo', '--timeout', '30m', sandboxName, '--',
      'chroot', '/opt/ubuntu', '/bin/bash', '-lc', certify,
    ], { timeoutMs: 32 * 60_000 });

    sandbox(['copy', `${sandboxName}:/opt/ubuntu/app/${artifactPath}`, resultFile], {
      timeoutMs: 3 * 60_000,
    });
    const result = JSON.parse(await readFile(resultFile, 'utf8'));
    await writeDeploymentArtifact(result);
    console.log(`[cert:${phase}] PASS for ${candidateSha}.`);
  } finally {
    if (created) cleanupSandbox();
    await rm(sourceArchive, { force: true });
    await rm(resultFile, { force: true });
  }
}

main().catch(async (error) => {
  const result = {
    status: 'FAIL',
    phase,
    candidateSha,
    runnerSha,
    commands: config?.commands ?? [],
    browsers: config?.browsers ?? [],
    supabaseHardening: config?.hardenSupabase ?? false,
    completedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  };
  console.error(`[cert:${phase}] FAIL:`, result.error);
  await writeDeploymentArtifact(result);
  await rm(sourceArchive, { force: true });
  await rm(resultFile, { force: true });
});
