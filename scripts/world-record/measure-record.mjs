#!/usr/bin/env node
/**
 * Generates machine-readable world record proof from gate manifest and repo metrics.
 * Run: pnpm run record:measure
 */

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadGateManifest } from '../lib/load-gate-manifest.mjs';

function run(command) {
  return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseReleaseGateSummary(output) {
  const passedMatch = output.match(/Passed: (\d+)/);
  const manualMatch = output.match(/Manual evidence required: (\d+)/);
  const failedMatch = output.match(/Failed: (\d+)/);
  return {
    passed: Number(passedMatch?.[1] ?? 0),
    manual: Number(manualMatch?.[1] ?? 0),
    failed: Number(failedMatch?.[1] ?? 0),
  };
}

function readGateUiSummary(root) {
  const statusPath = join(root, 'src', 'governance', 'gates', 'gate-ui-status.json');
  if (!existsSync(statusPath)) {
    return null;
  }

  const snapshot = JSON.parse(readFileSync(statusPath, 'utf8'));
  const gateEntries = Object.values(snapshot.gates ?? {});
  return {
    passed: gateEntries.filter((gate) => gate.status === 'pass').length,
    manual: gateEntries.filter((gate) => gate.status === 'warning').length,
    failed: gateEntries.filter((gate) => gate.status === 'fail').length,
    source: 'gate-ui-status.json',
    generatedAt: snapshot.generatedAt ?? null,
  };
}

function countTestFiles(root) {
  const dirs = [
    join(root, 'src', 'test'),
    join(root, 'src'),
    join(root, 'e2e'),
  ];
  const files = new Set();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    walk(dir, files);
  }

  return files.size;
}

function walk(dir, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
      continue;
    }
    if (/\.(test|spec)\.(t|j)sx?$/.test(entry.name)) {
      files.add(full);
    }
  }
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function main() {
  const root = process.cwd();
  const manifest = loadGateManifest();
  const gates = manifest.gates ?? [];
  const gateNames = gates.map((gate) => gate.name);
  const gateCount = gates.length;
  const metricGateCount = gates.filter((gate) => gate.number <= 12).length;

  let commit = 'unknown';
  try {
    commit = run('git rev-parse HEAD');
  } catch {
    // local without git
  }

  const timestamp = new Date().toISOString();
  const testFileCount = countTestFiles(root);

  const docsDir = join(root, 'docs', 'world-record');
  const publicDir = join(root, 'public', 'world-record');
  mkdirSync(docsDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  const docsPath = join(docsDir, 'latest-measurement.json');
  const publicPath = join(publicDir, 'latest-measurement.json');

  let releaseGateSummary = readGateUiSummary(root);

  if (process.env.RECORD_MEASURE_RUN_GATES === '1') {
    try {
      const output = run('node scripts/verify-all.js');
      releaseGateSummary = parseReleaseGateSummary(output);
    } catch (error) {
      const output = String(error?.stdout ?? '');
      if (output.includes('Passed:')) {
        releaseGateSummary = parseReleaseGateSummary(output);
      } else {
        releaseGateSummary = {
          passed: 0,
          manual: 0,
          failed: 1,
          error: String(error?.message ?? error),
        };
      }
    }
  }

  const payload = {
    product: manifest.product ?? 'Vishvakarma.OS',
    claimTitle: 'Most enforced pre-release compliance gates in a browser-native architectural floor plan editor',
    metricGateCount,
    gateCount,
    gateNames,
    testFileCount,
    commit,
    timestamp,
    reproduceCommand: 'pnpm run record:measure',
    status: 'self_verified',
    honestyNote:
      'Self-Verified Candidate — not an official Guinness World Records title until GWR adjudication completes and a certificate is attached.',
    releaseGateSummary,
  };

  payload.evidenceHash = sha256(JSON.stringify(payload, null, 2));
  const finalJson = `${JSON.stringify(payload, null, 2)}\n`;
  writeFileSync(docsPath, finalJson);
  writeFileSync(publicPath, finalJson);

  console.log(`World record measurement written:`);
  console.log(`  ${docsPath}`);
  console.log(`  ${publicPath}`);
  console.log(`  metricGateCount=${metricGateCount} gateCount=${gateCount} testFileCount=${testFileCount}`);
  console.log(`  evidenceHash=${payload.evidenceHash}`);
  console.log(`  commit=${commit}`);
}

main();
