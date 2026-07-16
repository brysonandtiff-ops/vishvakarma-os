#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const snapshotId = 'snap_jEsLVtxQ4CAvQeCRdbKAsPh565OG';
const sandboxName = `vish-inspect-chromium-${Date.now()}`;

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

function runInSandbox(command) {
  return runCli(['exec', '--sudo', '--timeout', '3m', sandboxName, '--', 'bash', '-lc', command]);
}

function cleanup() {
  runCli(['stop', sandboxName], 90_000);
  runCli(['remove', sandboxName], 90_000);
}

async function main() {
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN unavailable');

  const created = runCli([
    'create', '--name', sandboxName, '--snapshot', snapshotId,
    '--timeout', '10m', '--vcpus', '2', '--network-policy', 'allow-all',
  ]);
  if (created.status !== 0) {
    throw new Error(`Unable to restore snapshot: ${created.stderr || created.stdout}`);
  }

  try {
    const failureCount = runInSandbox(
      "find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | wc -l",
    );
    const uniqueFailures = runInSandbox(
      "for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort); do " +
        "name=$(grep -m1 '^- Name:' \"$f\" | sed 's/^- Name: //'); " +
        "err=$(sed -n '/# Error details/,/# Page snapshot/p' \"$f\" | grep -m1 -E '^Error:|^TimeoutError:|Touch targets below|strict mode violation|horizontal overflow|Stacked blocking|Clipped|Expected:|Received:'); " +
        "printf '%s\\t%s\\n' \"$name\" \"$err\"; done | sort -u",
    );
    const detailedFailures = runInSandbox(
      "for f in $(find /opt/ubuntu/app/test-results -name error-context.md -type f 2>/dev/null | sort | grep -v retry1); do " +
        "name=$(grep -m1 '^- Name:' \"$f\" | sed 's/^- Name: //'); " +
        "echo '===== TEST' \"$name\"; " +
        "sed -n '/# Error details/,/# Page snapshot/p' \"$f\" | sed '$d' | head -n 70; done",
    );
    const lastRun = runInSandbox(
      "cat /opt/ubuntu/app/test-results/.last-run.json 2>/dev/null || true",
    );
    const result = {
      snapshotId,
      sandboxName,
      failureCount,
      uniqueFailures,
      detailedFailures,
      lastRun,
      inspectedAt: new Date().toISOString(),
    };

    console.log(JSON.stringify(result, null, 2));
    await mkdir('dist', { recursive: true });
    const escaped = JSON.stringify(result, null, 2)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    await writeFile('dist/index.html', `<pre>${escaped}</pre>`, 'utf8');
  } finally {
    cleanup();
  }
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  cleanup();
  process.exit(1);
});
