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
  if (!sandboxName) throw new Error('No active production certification sandbox found.');

  const activeCommands = runInSandbox(
    sandboxName,
    "ps -eo pid,etimes,cmd --sort=etimes | grep -E 'pnpm run test:e2e|playwright test|run-e2e-gates|release:gates|launch:evidence' | grep -v grep || true",
  );
  const failedList = runInSandbox(sandboxName, "cat /opt/ubuntu/app/test-results/.last-run.json 2>/dev/null || true");
  const failureCount = runInSandbox(sandboxName, "find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | wc -l");
  const failureSummary = runInSandbox(
    sandboxName,
    "for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort); do " +
      "echo '===== '$(dirname \"$f\" | sed 's#^.*/##'); " +
      "grep -E '^- Name:|^Error:|^TimeoutError:|Touch targets below|Expected:|Received:|toBeVisible|toHaveCount|horizontal overflow|offscreen|overlap' \"$f\" | head -n 16; done",
  );
  const screenshotSummary = runInSandbox(
    sandboxName,
    "find /opt/ubuntu/app/test-results -name '*.png' -type f 2>/dev/null | sed 's#/test-failed-1.png##' | sed 's#^.*/##' | sort | uniq -c | tail -n 80",
  );
  const overlayShots = runInSandbox(
    sandboxName,
    "find /opt/ubuntu/app/test-results -type f -name '*.png' 2>/dev/null | grep -E 'overlay|onboarding|analytics|qa-ready' | sort | tail -n 40 || true",
  );
  const resultArtifact = runInSandbox(sandboxName, "cat /opt/ubuntu/app/docs/release/evidence/sandbox-production-certification-result.json 2>/dev/null || true");

  const result = {
    sandboxName,
    activeCommands,
    failedList,
    failureCount,
    failureSummary,
    screenshotSummary,
    overlayShots,
    resultArtifact,
    inspectedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));
  await mkdir('dist', { recursive: true });
  await writeFile(
    'dist/index.html',
    `<pre>${JSON.stringify(result, null, 2).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</pre>`,
    'utf8',
  );
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
