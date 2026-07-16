#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const sandboxName = 'vish-production-cert-1784162619175';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

function run(command) {
  const result = spawnSync('pnpm', [
    'dlx', 'sandbox', 'exec', '--sudo', '--timeout', '2m', sandboxName,
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
    timeout: 180_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');
  const processState = run("ps -eo pid,etimes,cmd --sort=etimes | tail -n 40");
  const artifacts = run("find /opt/ubuntu/app/test-results /opt/ubuntu/app/playwright-report /opt/ubuntu/app/docs/release/evidence -maxdepth 3 -type f -printf '%TY-%Tm-%TdT%TH:%TM:%TS %s %p\\n' 2>/dev/null | sort | tail -n 80");
  const result = { sandboxName, processState, artifacts, inspectedAt: new Date().toISOString() };
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
