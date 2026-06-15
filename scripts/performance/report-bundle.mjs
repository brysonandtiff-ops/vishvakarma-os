#!/usr/bin/env node

import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, pass, fail } from '../lib/cli.mjs';
import { parseDistAssets, formatBytes } from '../lib/parse-dist-assets.mjs';

const root = process.cwd();
const distDir = join(root, 'dist');
const baselinePath = join(root, 'docs', 'release', 'evidence', 'bundle-budget-report.json');
const buildOutputPath = join(root, 'docs', 'release', 'evidence', 'build-output.txt');

async function fileExists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function deltaLabel(current, previous) {
  if (previous == null) return 'n/a';
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatBytes(diff)}`;
}

async function main() {
  const { flags } = parseArgs();
  const updateBaseline = flags.has('update-baseline');

  const assets = await parseDistAssets(distDir, { includeGzip: true });
  let baseline = null;
  if (await fileExists(baselinePath)) {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  }

  const lines = [
    '# Vishvakarma.OS Bundle Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `dist total: ${formatBytes(assets.totalBytes)} (${assets.totalMb} MB)`,
    '',
    '| Chunk | Raw | Gzip | Delta vs baseline | Files |',
    '| --- | --- | --- | --- | --- |',
  ];

  const sortedChunks = Object.entries(assets.chunks).sort((a, b) => b[1].bytes - a[1].bytes);
  for (const [chunkKey, chunk] of sortedChunks) {
    const previous = baseline?.chunks?.[chunkKey]?.bytes;
    lines.push(
      `| ${chunkKey} | ${formatBytes(chunk.bytes)} | ${formatBytes(chunk.gzipBytes ?? 0)} | ${deltaLabel(chunk.bytes, previous)} | ${chunk.files.join(', ')} |`,
    );
  }

  const reportText = `${lines.join('\n')}\n`;
  console.log(reportText);
  await writeFile(buildOutputPath, reportText, 'utf8');
  console.log(`Wrote ${buildOutputPath}`);

  if (updateBaseline) {
    const payload = {
      generatedAt: new Date().toISOString(),
      distTotalBytes: assets.totalBytes,
      distTotalMb: assets.totalMb,
      chunks: assets.chunks,
      passed: true,
      failures: [],
    };
    await writeFile(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    pass('bundle-baseline', baselinePath);
  }
}

main().catch((error) => {
  fail('bundle-report', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
