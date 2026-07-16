#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function runCli(args, timeout = 240_000) {
  const result = spawnSync('pnpm', ['dlx', 'sandbox', ...args], {
    env: {
      ...process.env,
      VERCEL_TOKEN: oidcToken ?? '',
      VERCEL_TEAM_ID: teamId,
      VERCEL_PROJECT_ID: projectId,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function runInSandbox(sandboxName, command) {
  return runCli(['exec', '--sudo', '--timeout', '3m', sandboxName, '--', 'bash', '-lc', command]);
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');

  const listed = runCli(['list']);
  const names = `${listed.stdout}\n${listed.stderr}`.match(/vish-production-cert-\d+/g) ?? [];
  const sandboxName = [...new Set(names)].sort().at(-1);
  if (!sandboxName) throw new Error(`No active final certification sandbox found. ${listed.stdout || listed.stderr}`);

  const activeCommands = runInSandbox(
    sandboxName,
    "ps -eo pid,etimes,cmd --sort=etimes | grep -E 'pnpm run test:e2e|playwright test|run-e2e-gates|cross-browser|accessibility|editor-performance|production-auth|release:gates|launch:evidence' | grep -v grep || true",
  );
  const lastRun = runInSandbox(sandboxName, "cat /opt/ubuntu/app/test-results/.last-run.json 2>/dev/null || true");
  const failureCount = runInSandbox(sandboxName, "find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | wc -l");
  const uniqueFailures = runInSandbox(
    sandboxName,
    "for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort); do " +
      "name=$(grep -m1 '^- Name:' \"$f\" | sed 's/^- Name: //'); " +
      "err=$(grep -m1 -E '^Error:|^TimeoutError:|Touch targets below|strict mode violation|horizontal overflow|Stacked blocking|Clipped' \"$f\"); " +
      "printf '%s\\t%s\\n' \"$name\" \"$err\"; done | sort -u",
  );
  const resultArtifact = runInSandbox(
    sandboxName,
    "cat /opt/ubuntu/app/docs/release/evidence/sandbox-production-certification-result.json 2>/dev/null || true",
  );
  const evidenceTail = runInSandbox(
    sandboxName,
    "find /opt/ubuntu/app/docs/release/evidence -maxdepth 2 -type f -printf '%TY-%Tm-%TdT%TH:%TM:%TS %s %p\\n' 2>/dev/null | sort | tail -n 40",
  );

  const result = {
    sandboxName,
    activeCommands,
    lastRun,
    failureCount,
    uniqueFailures,
    resultArtifact,
    evidenceTail,
    inspectedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));
  await mkdir('dist', { recursive: true });
  const escaped = JSON.stringify(result, null, 2)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  await writeFile('dist/index.html', `<pre>${escaped}</pre>`, 'utf8');
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
