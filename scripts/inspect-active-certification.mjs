#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = 'vish-production-cert-1784211838523';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function run(command) {
  const result = spawnSync('pnpm', [
    'dlx', 'sandbox', 'exec', '--sudo', '--timeout', '3m', sandboxName,
    '--', 'bash', '-lc', command,
  ], {
    env: {
      ...process.env,
      VERCEL_TOKEN: oidcToken ?? '',
      VERCEL_TEAM_ID: teamId,
      VERCEL_PROJECT_ID: projectId,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 240_000,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');
  const processState = run("ps -eo pid,etimes,cmd --sort=etimes | tail -n 90");
  const failedList = run("cat /opt/ubuntu/app/test-results/.last-run.json 2>/dev/null || true");
  const failureContext = run("for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort); do echo '===== CONTEXT ' $f; cat \"$f\"; done");
  const traceErrors = run("for f in $(find /opt/ubuntu/app/test-results -name trace.zip -type f 2>/dev/null | sort); do echo '===== TRACE ' $f; unzip -p \"$f\" trace.trace 2>/dev/null | grep -E '\"type\":\"(before|after|error)\"|locator|Timeout|timed out|click' | tail -n 140; done");
  const result = { sandboxName, processState, failedList, failureContext, traceErrors, inspectedAt: new Date().toISOString() };
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
