#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const candidateSha = '53ea1445f71e976c19a99a53833cf50ec267ee4c';
const phase = process.env.CERT_PHASE?.trim() || '';
const runnerSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || 'unknown';
const managementToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

const chromiumInstall = 'pnpm exec playwright install chromium';

const PHASES = {
  auth: {
    hardenSupabase: true,
    commands: [
      chromiumInstall,
      'pnpm exec playwright test --project=auth-gate-chromium',
    ],
  },
  'app-editor': {
    hardenSupabase: false,
    commands: [
      chromiumInstall,
      'pnpm exec playwright test --project=app-smoke-chromium e2e/ipad-editor-layout.spec.ts e2e/ipad-editor-workflow.spec.ts e2e/ipad-editor-current-contract.spec.ts e2e/full-customer-audit.spec.ts e2e/editor-features.spec.ts',
    ],
  },
  'app-ui': {
    hardenSupabase: false,
    commands: [
      chromiumInstall,
      'pnpm exec playwright test --project=app-smoke-chromium e2e/device-governance-layout.spec.ts e2e/device-marketing-layout.spec.ts e2e/device-phone-editor.spec.ts e2e/device-collaboration-chrome.spec.ts e2e/device-desktop-layout.spec.ts e2e/governance-smoke.spec.ts e2e/marketing-pages.spec.ts e2e/overlay-exclusivity.spec.ts e2e/menu-overlap.spec.ts e2e/device-validation-proof-panel.spec.ts',
    ],
  },
  'app-services': {
    hardenSupabase: false,
    commands: [
      chromiumInstall,
      'pnpm exec playwright test --project=app-smoke-chromium e2e/workspace-navigation.spec.ts e2e/projects-profile.spec.ts e2e/optimization.spec.ts e2e/ai-designer.spec.ts e2e/collaboration-sync.spec.ts e2e/compliance-gate.spec.ts e2e/akasha-cast.spec.ts',
    ],
  },
  firefox: {
    hardenSupabase: false,
    commands: [
      'pnpm exec playwright install firefox',
      'pnpm exec playwright test --project=auth-gate-firefox',
      'pnpm exec playwright test --project=cross-browser-smoke-firefox',
    ],
  },
  webkit: {
    hardenSupabase: false,
    commands: [
      'pnpm exec playwright install webkit',
      'pnpm exec playwright test --project=auth-gate-webkit',
      'pnpm exec playwright test --project=cross-browser-smoke-webkit',
    ],
  },
  a11y: {
    hardenSupabase: false,
    commands: [chromiumInstall, 'pnpm run test:e2e:a11y'],
  },
  'perf-auth': {
    hardenSupabase: false,
    commands: [
      chromiumInstall,
      'pnpm run test:e2e:perf',
      'pnpm run verify:production-auth-flow',
    ],
  },
  release: {
    hardenSupabase: false,
    commands: [chromiumInstall, 'pnpm run release:gates:strict'],
  },
  evidence: {
    hardenSupabase: false,
    commands: ['pnpm run launch:evidence:strict'],
  },
};

const config = PHASES[phase];

function run(command, timeoutMs = 9 * 60_000) {
  console.log(`[direct-cert:${phase}] ${command}`);
  const result = spawnSync(command, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CI: '1',
      VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
      VITE_ALLOW_LOCAL_DEMO: 'true',
      PRODUCTION_AUTH_URL: 'https://vishvakarma-os.app/auth',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
    shell: true,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    const timeoutNote = result.error?.code === 'ETIMEDOUT' ? ' timed out' : '';
    throw new Error(`${command}${timeoutNote} with exit code ${result.status}`);
  }
}

async function writeResult(result) {
  await mkdir('dist', { recursive: true });
  await writeFile('dist/certification-result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const escaped = JSON.stringify(result, null, 2)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  await writeFile(
    'dist/index.html',
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Vishvakarma.OS ${phase} certification</title></head><body><h1>Vishvakarma.OS ${phase} certification</h1><pre>${escaped}</pre></body></html>`,
    'utf8',
  );
}

async function main() {
  if (!config) throw new Error(`Unknown CERT_PHASE: ${phase || '(empty)'}`);
  if (config.hardenSupabase && !managementToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN is unavailable for hosted Auth hardening.');
  }

  console.log(`[direct-cert:${phase}] Candidate source SHA: ${candidateSha}`);
  console.log(`[direct-cert:${phase}] Runner SHA: ${runnerSha}`);

  if (config.hardenSupabase) {
    run('pnpm run setup:supabase-auth:hardening', 5 * 60_000);
  }

  for (const command of config.commands) run(command);

  await writeResult({
    status: 'PASS',
    phase,
    candidateSha,
    runnerSha,
    commands: config.commands,
    supabaseHardening: config.hardenSupabase,
    completedAt: new Date().toISOString(),
  });
  console.log(`[direct-cert:${phase}] PASS for ${candidateSha}.`);
}

main().catch(async (error) => {
  const result = {
    status: 'FAIL',
    phase,
    candidateSha,
    runnerSha,
    commands: config?.commands ?? [],
    supabaseHardening: config?.hardenSupabase ?? false,
    completedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  };
  console.error(`[direct-cert:${phase}] FAIL:`, result.error);
  await writeResult(result);
});
