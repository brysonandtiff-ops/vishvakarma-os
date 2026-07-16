#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = `vish-cert-probe-${Date.now()}`;
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function run(args, { allowFailure = false } = {}) {
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
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (!allowFailure && result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}: pnpm ${args.join(' ')}`);
  }

  return result;
}

async function writeProbeArtifact(status) {
  await mkdir('dist', { recursive: true });
  await writeFile(
    'dist/index.html',
    `<!doctype html><html><body><h1>Vishvakarma.OS Sandbox Probe</h1><pre>${status}</pre></body></html>`,
    'utf8',
  );
}

async function main() {
  console.log(`[sandbox-probe] Vercel OIDC credential: ${oidcToken ? 'configured' : 'not configured'}`);
  if (!oidcToken) {
    await writeProbeArtifact('FAIL: VERCEL_OIDC_TOKEN is unavailable.');
    throw new Error('VERCEL_OIDC_TOKEN is unavailable; Sandbox cannot authenticate.');
  }

  let created = false;
  try {
    run(['dlx', 'sandbox', '--version']);
    run([
      'dlx',
      'sandbox',
      'create',
      '--name',
      sandboxName,
      '--runtime',
      'node24',
      '--timeout',
      '5m',
    ]);
    created = true;
    run(['dlx', 'sandbox', 'exec', '--sudo', sandboxName, '--', 'dnf', '--version']);
    run(['dlx', 'sandbox', 'exec', sandboxName, '--', 'node', '--version']);
    await writeProbeArtifact(`PASS: ${sandboxName} created and sudo execution verified.`);
    console.log('[sandbox-probe] PASS — Sandbox creation and sudo execution verified.');
  } finally {
    if (created) {
      run(['dlx', 'sandbox', 'stop', sandboxName], { allowFailure: true });
      run(['dlx', 'sandbox', 'remove', sandboxName], { allowFailure: true });
    }
  }
}

main().catch(async (error) => {
  console.error('[sandbox-probe] FAIL:', error instanceof Error ? error.message : String(error));
  await writeProbeArtifact(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
