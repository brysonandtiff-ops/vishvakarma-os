#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

function run(command) {
  const result = spawnSync('bash', ['-lc', command], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

async function main() {
  const sourceMatches = run(
    "grep -RInE --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map' " +
      "'Device Validation|Device validation proof mode|vish-device-validation|Optional product analytics|vish-editor-overlay-backdrop' src e2e 2>/dev/null | head -n 400",
  );

  const matchingFiles = run(
    "grep -RIlE --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map' " +
      "'Device Validation|Device validation proof mode|vish-device-validation|Optional product analytics|vish-editor-overlay-backdrop' src e2e 2>/dev/null | sort",
  );

  const fileContents = run(
    "for f in $(grep -RIlE --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map' " +
      "'Device Validation|Device validation proof mode|vish-device-validation|Optional product analytics|vish-editor-overlay-backdrop' src e2e 2>/dev/null | sort); do " +
      "echo '===== FILE' $f; sed -n '1,320p' \"$f\"; done",
  );

  const result = {
    sourceMatches,
    matchingFiles,
    fileContents,
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
