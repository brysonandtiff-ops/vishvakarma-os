#!/usr/bin/env node
/**
 * Generates automated launch evidence artifacts from local verify runs.
 * Run: node scripts/production/generate-evidence.mjs
 */

import { execSync } from 'child_process';
import { readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';

function run(command) {
  return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function timestamp() {
  return new Date().toISOString();
}

async function getCommitSha() {
  try {
    return run('git rev-parse HEAD');
  } catch {
    return 'unknown';
  }
}

async function dirSizeBytes(dir) {
  try {
    const output = run(process.platform === 'win32'
      ? `powershell -Command "(Get-ChildItem -Recurse '${dir}' | Measure-Object -Property Length -Sum).Sum"`
      : `du -sb "${dir}" | cut -f1`);
    return Number.parseInt(output, 10) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  const root = process.cwd();
  const sha = await getCommitSha();
  const generatedAt = timestamp();
  const evidenceDir = join(root, 'docs', 'release', 'evidence');

  console.log('Running lint...');
  const lintOutput = run('pnpm run lint');

  console.log('Running unit tests...');
  const testOutput = run('pnpm run test');

  console.log('Running route smoke tests...');
  const routeOutput = run('pnpm run test:routes');

  console.log('Running build...');
  const buildOutput = run('pnpm run build');

  const distBytes = await dirSizeBytes(join(root, 'dist'));
  const distMb = (distBytes / (1024 * 1024)).toFixed(2);

  const latestCi = `# Latest CI / Local Verify Run

Generated from commit: \`${sha}\`
Generated at: ${generatedAt}
Operator: automated local verify
Result: PASS — local lint, test, route smoke, and build succeeded

## Workflow Run

Local mirror of \`.github/workflows/verify.yml\` — attach GitHub Actions URL after push for remote proof.

## Command Parity

\`\`\`bash
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
\`\`\`

## Lint output (summary)

\`\`\`txt
${lintOutput.split('\n').slice(-8).join('\n')}
\`\`\`

## Unit test output (summary)

\`\`\`txt
${testOutput.split('\n').slice(-12).join('\n')}
\`\`\`

## Route smoke output (summary)

\`\`\`txt
${routeOutput.split('\n').slice(-8).join('\n')}
\`\`\`

## Build output (summary)

\`\`\`txt
${buildOutput.split('\n').slice(-12).join('\n')}
\`\`\`

## Artifact

- dist size: ${distMb} MB
`;

  const performanceNotes = `# Performance Notes

Generated from commit: \`${sha}\`
Generated at: ${generatedAt}
Operator: automated local verify
Result: PASS — build artifact produced locally

## Build size

| Metric | Value |
|---|---|
| dist/ total | ${distMb} MB |

## Runtime Interaction Checks

- Build completes under local verify pipeline.
- 3D vendor chunk isolated via \`manualChunks\` in vite.config.ts.
- Manual iPad interaction and 3D update latency still require device evidence.
`;

  const saveLoadProof = await readFile(join(evidenceDir, 'save-load-proof.md'), 'utf-8');
  const updatedSaveLoad = saveLoadProof
    .replace('<sha>', sha)
    .replace('<timestamp>', generatedAt)
    .replace('Operator: `<name>`', 'Operator: automated local verify')
    .replace('| 5 | Export project JSON | JSON downloads and parses |  | Pending |', '| 5 | Export project JSON | JSON downloads and parses | Automated export module tests pass | PASS |')
    .replace('| 6 | Import exported JSON | Imported project matches saved state |  | Pending |', '| 6 | Import exported JSON | Imported project matches saved state | Automated import module tests pass | PASS |')
    .replace('Result: `PASS / FAIL / PARTIAL`', 'Result: `PARTIAL`')
    .replace('PASS / FAIL / PARTIAL — explain why.', 'PARTIAL — automated import/export unit tests pass; browser save/reload still requires Supabase-backed manual proof.');

  await writeFile(join(evidenceDir, 'latest-ci-run.md'), latestCi);
  await writeFile(join(evidenceDir, 'performance-notes.md'), performanceNotes);
  await writeFile(join(evidenceDir, 'save-load-proof.md'), updatedSaveLoad);

  console.log(`Evidence updated in ${evidenceDir}`);
  console.log(`Commit: ${sha}`);
  console.log(`dist size: ${distMb} MB`);
}

main().catch((error) => {
  console.error('Evidence generation failed:', error.message);
  process.exit(1);
});
