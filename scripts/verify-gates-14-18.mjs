#!/usr/bin/env node
/**
 * World-class release gates 14–18 — invoked from verify-all.js and CI.
 * Run: node scripts/verify-gates-14-18.mjs [--gate=N]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const gateArg = process.argv.find((a) => a.startsWith('--gate='));
const singleGate = gateArg ? Number(gateArg.split('=')[1]) : null;

function runVitest(testPath) {
  execSync(`pnpm exec vitest run ${testPath}`, { stdio: 'pipe', encoding: 'utf-8', cwd: root });
}

function readText(relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

function assertFileContains(relPath, needles, label) {
  if (!existsSync(join(root, relPath))) {
    throw new Error(`${label}: missing file ${relPath}`);
  }
  const text = readText(relPath);
  for (const needle of needles) {
    if (!text.includes(needle)) {
      throw new Error(`${label}: ${relPath} missing "${needle}"`);
    }
  }
}

const GATE_CHECKS = {
  14: {
    name: 'Gate 14: Compliance rule pack integrity',
    run() {
      runVitest('src/modules/compliance/rulePacks/auNccVol2H1.test.ts');
    },
  },
  15: {
    name: 'Gate 15: BIM graph adapter parity',
    run() {
      runVitest('src/domain/buildingGraph/manifestAdapter.test.ts');
    },
  },
  16: {
    name: 'Gate 16: DXF import regression',
    run() {
      runVitest('src/core/importers/dxfImport.test.ts');
    },
  },
  17: {
    name: 'Gate 17: Sheet set composer scaffold',
    run() {
      runVitest('src/modules/sheetSet/sheetSetComposer.test.ts');
      runVitest('src/modules/sheetSet/sheetSetPdfExport.test.ts');
    },
  },
  18: {
    name: 'Gate 18: Decision intelligence disclaimer present',
    run() {
      runVitest('src/governance/gates/decisionIntelligenceDisclaimer.test.ts');
    },
  },
};

function main() {
  const gatesToRun = singleGate ? [singleGate] : [14, 15, 16, 17, 18];
  const failures = [];

  for (const num of gatesToRun) {
    const check = GATE_CHECKS[num];
    if (!check) {
      failures.push(`Unknown gate ${num}`);
      continue;
    }
    try {
      check.run();
      console.log(`[PASS] ${check.name}`);
    } catch (error) {
      const message = String(error?.stdout ?? error?.message ?? error);
      failures.push(`${check.name}: ${message}`);
      console.error(`[FAIL] ${check.name}`);
      console.error(message);
    }
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
