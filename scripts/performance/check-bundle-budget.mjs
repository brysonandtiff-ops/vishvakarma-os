#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, exitWithFailures, pass, fail } from '../lib/cli.mjs';
import { parseDistAssets, formatBytes } from '../lib/parse-dist-assets.mjs';
import { getCommitSha } from '../lib/run-command.mjs';

const root = process.cwd();
const distDir = join(root, 'dist');
const budgetPath = join(root, 'scripts', 'performance', 'bundle-budget.json');
const reportPath = join(root, 'docs', 'release', 'evidence', 'bundle-budget-report.json');

async function main() {
  const failures = [];

  if (!existsSync(distDir)) {
    failures.push('dist/ missing — run pnpm run build first');
    exitWithFailures(failures);
  }

  const budget = JSON.parse(await readFile(budgetPath, 'utf8'));
  const assets = await parseDistAssets(distDir);
  const sha = await getCommitSha();

  if (assets.totalMb > budget.totalDistMb) {
    failures.push(`dist total ${assets.totalMb} MB exceeds budget ${budget.totalDistMb} MB`);
  }

  for (const [chunkKey, maxBytes] of Object.entries(budget.chunks)) {
    const chunk = assets.chunks[chunkKey];
    if (!chunk) continue;
    if (chunk.bytes > maxBytes) {
      failures.push(
        `${chunkKey} ${formatBytes(chunk.bytes)} exceeds budget ${formatBytes(maxBytes)} (${chunk.files.join(', ')})`,
      );
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    commit: sha,
    distTotalBytes: assets.totalBytes,
    distTotalMb: assets.totalMb,
    budget,
    chunks: assets.chunks,
    passed: failures.length === 0,
    failures,
  };

  await mkdir(join(root, 'docs', 'release', 'evidence'), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${reportPath}`);

  for (const [chunkKey, chunk] of Object.entries(assets.chunks)) {
    const maxBytes = budget.chunks[chunkKey];
    const within = !maxBytes || chunk.bytes <= maxBytes;
    console.log(`${within ? 'PASS' : 'FAIL'} ${chunkKey}: ${formatBytes(chunk.bytes)}`);
  }

  if (failures.length > 0) {
    fail('bundle-budget', `${failures.length} violation(s)`);
    exitWithFailures(failures);
  }

  pass('bundle-budget', `dist ${assets.totalMb} MB within budget`);
}

main().catch((error) => {
  fail('bundle-budget', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
