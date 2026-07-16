#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function baseEnv() {
  return {
    ...process.env,
    VERCEL_TOKEN: oidcToken ?? '',
    VERCEL_TEAM_ID: teamId,
    VERCEL_PROJECT_ID: projectId,
  };
}

function runCli(args, timeout = 240_000) {
  const result = spawnSync('pnpm', ['dlx', 'sandbox', ...args], {
    env: baseEnv(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function runInSandbox(sandboxName, command) {
  return runCli([
    'exec', '--sudo', '--timeout', '3m', sandboxName,
    '--', 'bash', '-lc', command,
  ]);
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');

  const listed = runCli(['list']);
  const names = `${listed.stdout}\n${listed.stderr}`.match(/vish-production-cert-\d+/g) ?? [];
  const sandboxName = [...new Set(names)].sort().at(-1);
  if (!sandboxName) {
    throw new Error(`No active production certification sandbox found. List output: ${listed.stdout || listed.stderr}`);
  }

  const processState = runInSandbox(sandboxName, "ps -eo pid,etimes,cmd --sort=etimes | tail -n 90");
  const failedList = runInSandbox(sandboxName, "cat /opt/ubuntu/app/test-results/.last-run.json 2>/dev/null || true");
  const failureContext = runInSandbox(sandboxName, "for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort); do echo '===== CONTEXT ' $f; cat \"$f\"; done");
  const resultArtifact = runInSandbox(sandboxName, "cat /opt/ubuntu/app/docs/release/evidence/sandbox-production-certification-result.json 2>/dev/null || true");
  const result = {
    sandboxName,
    listed,
    processState,
    failedList,
    failureContext,
    resultArtifact,
    inspectedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(result, null, 2));
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${JSON.stringify(result, null, 2)}</pre>`, 'utf8');
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
