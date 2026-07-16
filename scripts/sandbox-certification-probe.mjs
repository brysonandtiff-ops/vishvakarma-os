#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = `vish-container-tool-probe-${Date.now()}`;
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
    `<!doctype html><html><body><h1>Sandbox Container Tool Probe</h1><pre>${status}</pre></body></html>`,
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
      "dnf -q search podman buildah skopeo containers-common docker 2>/dev/null || true; echo '---PROVIDERS---'; dnf -q repoquery --whatprovides '*/podman' '*/buildah' '*/skopeo' '*/docker' 2>/dev/null || true",
    ]);
    await writeArtifact('PASS: package inventory captured in build logs.');
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
