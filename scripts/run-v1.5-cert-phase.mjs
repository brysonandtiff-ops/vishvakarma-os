#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const candidateSha = '3620e39fc1ed7e85d153ede1364ef86601aec75d';
const snapshotId = 'snap_jEsLVtxQ4CAvQeCRdbKAsPh565OG';
const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();
const runnerSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || 'unknown';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const sourceArchive = `/tmp/vish-v1.5-${phase}.tgz`;
const sandboxName = `vish-v1-5-${phase}-${Date.now()}`;

const PHASES = {
  auth: 'pnpm run test:e2e:auth',
  editor: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/ipad-editor-layout.spec.ts e2e/ipad-editor-workflow.spec.ts e2e/ipad-editor-current-contract.spec.ts e2e/full-customer-audit.spec.ts e2e/editor-features.spec.ts',
  ui: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/device-governance-layout.spec.ts e2e/device-marketing-layout.spec.ts e2e/device-phone-editor.spec.ts e2e/device-collaboration-chrome.spec.ts e2e/device-desktop-layout.spec.ts e2e/governance-smoke.spec.ts e2e/marketing-pages.spec.ts e2e/overlay-exclusivity.spec.ts e2e/menu-overlap.spec.ts e2e/device-validation-proof-panel.spec.ts',
  services: 'node scripts/run-local-preview-playwright.mjs --project=app-smoke-chromium e2e/workspace-navigation.spec.ts e2e/projects-profile.spec.ts e2e/optimization.spec.ts e2e/ai-designer.spec.ts e2e/collaboration-sync.spec.ts e2e/compliance-gate.spec.ts e2e/akasha-cast.spec.ts',
  crossbrowser: 'pnpm run test:e2e:cross-browser',
  a11y: 'pnpm run test:e2e:a11y',
  perfauth: 'pnpm run test:e2e:perf && pnpm run verify:production-auth-flow',
  release: 'pnpm run release:gates:strict',
  evidence: 'pnpm run launch:evidence:strict',
};

const command = PHASES[phase];

function run(program, args, { allowFailure = false, timeoutMs = 12 * 60_000 } = {}) {
  console.log(`[v1.5-cert:${phase}] ${[program, ...args].join(' ')}`);
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
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (!allowFailure && result.status !== 0) {
    const timedOut = result.error?.code === 'ETIMEDOUT' ? ' timed out' : '';
    const detail = result.error?.message ? `: ${result.error.message}` : '';
    throw new Error(`${[program, ...args].join(' ')}${timedOut}; exit ${result.status}${detail}`);
  }

  return result;
}

function sandbox(args, options = {}) {
  return run('pnpm', ['dlx', 'sandbox', ...args], options);
}

async function writeResult(result) {
  await mkdir('dist', { recursive: true });
  await writeFile('dist/certification-result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const escaped = JSON.stringify(result, null, 2)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  await writeFile('dist/index.html', `<pre>${escaped}</pre>`, 'utf8');
}

function cleanup() {
  sandbox([
    'exec', '--sudo', '--timeout', '90s', sandboxName, '--', 'bash', '-lc',
    'umount -l /opt/ubuntu/proc 2>/dev/null || true; umount -l /opt/ubuntu/sys 2>/dev/null || true; umount -l /opt/ubuntu/dev/pts 2>/dev/null || true; umount -l /opt/ubuntu/dev 2>/dev/null || true',
  ], { allowFailure: true, timeoutMs: 2 * 60_000 });
  sandbox(['stop', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
  sandbox(['remove', sandboxName], { allowFailure: true, timeoutMs: 90_000 });
}

async function main() {
  if (!command) throw new Error(`Unknown certification phase: ${phase || '(empty)'}`);
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');

  run('tar', [
    '--exclude=.git', '--exclude=node_modules', '--exclude=dist', '--exclude=coverage',
    '--exclude=playwright-report', '--exclude=test-results', '--exclude=.vercel',
    '-czf', sourceArchive, '.',
  ], { timeoutMs: 4 * 60_000 });

  let created = false;
  try {
    sandbox([
      'create', '--name', sandboxName, '--snapshot', snapshotId,
      '--timeout', '40m', '--vcpus', '4', '--network-policy', 'allow-all',
    ], { timeoutMs: 4 * 60_000 });
    created = true;
    sandbox(['copy', sourceArchive, `${sandboxName}:/tmp/source.tgz`], { timeoutMs: 4 * 60_000 });

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

    sandbox(['exec', '--sudo', '--timeout', '4m', sandboxName, '--', 'bash', '-lc', refresh], {
      timeoutMs: 5 * 60_000,
    });

    const certify = [
      'set -euo pipefail',
      'cd /app',
      'corepack enable',
      'corepack prepare pnpm@9.15.0 --activate',
      'pnpm install --frozen-lockfile',
      'export CI=1',
      'export VITE_E2E_ALLOW_LOCAL_ACCESS=true',
      'export VITE_ALLOW_LOCAL_DEMO=true',
      'export PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth',
      command,
    ].join('; ');

    sandbox([
      'exec', '--sudo', '--timeout', '26m', sandboxName, '--',
      'chroot', '/opt/ubuntu', '/bin/bash', '-lc', certify,
    ], { timeoutMs: 28 * 60_000 });

    await writeResult({
      status: 'PASS',
      phase,
      candidateSha,
      runnerSha,
      snapshotId,
      command,
      completedAt: new Date().toISOString(),
    });
  } finally {
    if (created) cleanup();
    await rm(sourceArchive, { force: true });
  }
}

main().catch(async (error) => {
  await writeResult({
    status: 'FAIL',
    phase,
    candidateSha,
    runnerSha,
    snapshotId,
    command: command ?? null,
    error: error instanceof Error ? error.message : String(error),
    completedAt: new Date().toISOString(),
  });
  await rm(sourceArchive, { force: true });
  process.exitCode = 1;
});
