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
  const uniqueFailures = runInSandbox(
    sandboxName,
    `cd /opt/ubuntu/app && python3 - <<'PY'\nimport glob, json, os, re\nrows = {}\nfor path in glob.glob('test-results/**/error-context.md', recursive=True):\n    text = open(path, encoding='utf-8', errors='replace').read()\n    name_match = re.search(r'^- Name:\\s*(.+)$', text, re.M)\n    name = name_match.group(1).strip() if name_match else os.path.basename(os.path.dirname(path))\n    code_match = re.search(r'```(?:\\w+)?\\n(.*?)\\n```', text, re.S)\n    block = code_match.group(1).strip() if code_match else text\n    lines = [line.strip() for line in block.splitlines() if line.strip()]\n    first = next((line for line in lines if line.startswith(('Error:', 'TimeoutError:', 'Expected:', 'Received:'))), lines[0] if lines else 'Unknown failure')\n    rows.setdefault(name, set()).add(first[:320])\nprint(json.dumps({name: sorted(errors) for name, errors in sorted(rows.items())}, indent=2))\nPY`,
  );
  const sourceMatches = runInSandbox(
    sandboxName,
    "cd /opt/ubuntu/app && grep -RInE --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map' 'Follow presenter|landing page fits|Device marketing layout|CastViewer|cast-viewer-controls' src e2e 2>/dev/null | head -n 500",
  );
  const sourceFiles = runInSandbox(
    sandboxName,
    "cd /opt/ubuntu/app && for f in $(grep -RIlE --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map' 'Follow presenter|Device marketing layout|cast-viewer-controls' src e2e 2>/dev/null | sort -u); do echo '===== FILE' $f; sed -n '1,280p' \"$f\"; done",
  );
  const overlayShots = runInSandbox(
    sandboxName,
    "find /opt/ubuntu/app/test-results -type f -name '*.png' 2>/dev/null | grep -E 'overlay|onboarding|analytics|qa-ready' | sort | tail -n 50 || true",
  );
  const resultArtifact = runInSandbox(sandboxName, "cat /opt/ubuntu/app/docs/release/evidence/sandbox-production-certification-result.json 2>/dev/null || true");

  const result = {
    sandboxName,
    activeCommands,
    failedList,
    uniqueFailures,
    sourceMatches,
    sourceFiles,
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
