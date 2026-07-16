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
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

async function main() {
  const symbols = [
    'emulateCoarsePointer',
    'emulateFinePointer',
    'androidTabletLandscape',
    'assertActiveDialogFitsIpad',
    'activateEditorTool',
  ];
  const results = Object.fromEntries(
    symbols.map((symbol) => [
      symbol,
      run(`grep -RIn -C 5 --include='*.ts' --include='*.tsx' ${JSON.stringify(symbol)} e2e src 2>/dev/null || true`),
    ]),
  );
  const helpers = run("sed -n '1,380p' e2e/helpers.ts; echo '---DEVICE---'; sed -n '1,280p' e2e/deviceTouchTargets.ts");
  const output = { results, helpers, inspectedAt: new Date().toISOString() };
  console.log(JSON.stringify(output, null, 2));
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${JSON.stringify(output, null, 2)}</pre>`, 'utf8');
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
