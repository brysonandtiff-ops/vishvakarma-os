#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { exitWithFailures, fail, pass } from '../lib/cli.mjs';
import { parseDistAssets, formatBytes } from '../lib/parse-dist-assets.mjs';
import { getCommitSha } from '../lib/run-command.mjs';

const root = process.cwd();
const distDir = join(root, 'dist');
const budgetPath = join(root, 'scripts', 'performance', 'bundle-budget.json');
const reportPath = join(root, 'docs', 'release', 'evidence', 'bundle-budget-report.json');
const deployReportPath = join(distDir, 'release-evidence', 'bundle-budget-report.json');
const reportOnly = process.argv.includes('--report-only') || process.env.BUNDLE_BUDGET_REPORT_ONLY === '1';
const totalOnly = process.argv.includes('--total-only');

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

  if (!totalOnly) {
    for (const [chunkKey, maxBytes] of Object.entries(budget.chunks)) {
      const chunk = assets.chunks[chunkKey];
      if (!chunk) continue;
      if (chunk.bytes > maxBytes) {
        failures.push(
          `${chunkKey} ${formatBytes(chunk.bytes)} exceeds budget ${formatBytes(maxBytes)} (${chunk.files.join(', ')})`,
        );
      }
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
    reportOnly,
    totalOnly,
  };

  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(join(root, 'docs', 'release', 'evidence'), { recursive: true });
  await writeFile(reportPath, json, 'utf8');
  await mkdir(join(distDir, 'release-evidence'), { recursive: true });
  await writeFile(deployReportPath, json, 'utf8');
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${deployReportPath}`);

  for (const [chunkKey, chunk] of Object.entries(assets.chunks)) {
    const maxBytes = budget.chunks[chunkKey];
    const within = !maxBytes || chunk.bytes <= maxBytes;
    console.log(`${within ? 'PASS' : 'FAIL'} ${chunkKey}: ${formatBytes(chunk.bytes)}`);
  }

  if (failures.length > 0) {
    if (reportOnly) {
      console.warn(`REPORT-ONLY bundle-budget: ${failures.length} violation(s)`);
      for (const failure of failures) console.warn(` - ${failure}`);
      return;
    }
    fail('bundle-budget', `${failures.length} violation(s)`);
    exitWithFailures(failures);
  }

  pass('bundle-budget', totalOnly ? `dist ${assets.totalMb} MB within total budget` : `dist ${assets.totalMb} MB within budget`);
}

main().catch((error) => {
  fail('bundle-budget', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
