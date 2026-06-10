#!/usr/bin/env node
/**
 * Build gate enforcement — requires build-gate.manifest.ts when core paths change.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'src', 'core-contract', 'build-gate.manifest.ts');

const WATCH_PREFIXES = [
  'src/core-contract/',
  'system-map.json',
  'src/services/optimization/',
  'src/services/floorplan-generation/',
  'src/modules/compliance/',
  'src/services/cost-estimation/',
  'src/services/council-intelligence/',
];

function getChangedFiles() {
  try {
    const event = process.env.GITHUB_EVENT_NAME;
    let range = 'HEAD~1...HEAD';
    if (event === 'pull_request' && process.env.GITHUB_BASE_REF) {
      range = `origin/${process.env.GITHUB_BASE_REF}...HEAD`;
    } else if (event === 'push') {
      range = 'HEAD~1...HEAD';
    }
    const out = execSync(`git diff --name-only ${range}`, {
      encoding: 'utf8',
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function touchesWatchPath(files) {
  return files.some((file) => WATCH_PREFIXES.some((prefix) => file.startsWith(prefix) || file === prefix));
}

function parseManifest(source) {
  const bool = (key) => /true/.test(source.match(new RegExp(`${key}:\\s*(true|false)`))?.[1] ?? '');
  const reasonMatch = source.match(/reason:\s*'([^']*)'/);
  return {
    touchesCore: bool('touchesCore'),
    modifiesPipeline: bool('modifiesPipeline'),
    affectsCompliance: bool('affectsCompliance'),
    affectsCostModel: bool('affectsCostModel'),
    requiresRevalidation: bool('requiresRevalidation'),
    valuationImpactReason: reasonMatch?.[1] ?? '',
  };
}

function validateGate(gate) {
  const errors = [];
  if (gate.touchesCore && !gate.requiresRevalidation) {
    errors.push('touchesCore=true requires requiresRevalidation=true');
  }
  if (gate.affectsCompliance && !gate.requiresRevalidation) {
    errors.push('affectsCompliance=true requires requiresRevalidation=true');
  }
  if (gate.affectsCostModel && !gate.valuationImpactReason) {
    errors.push('affectsCostModel=true requires valuationImpact.reason');
  }
  return errors;
}

const changed = getChangedFiles();
const coreTouched = changed.length === 0 ? true : touchesWatchPath(changed);

if (!existsSync(manifestPath)) {
  console.error('[BUILD_GATE_FAIL] Missing src/core-contract/build-gate.manifest.ts');
  process.exit(1);
}

const manifestSource = readFileSync(manifestPath, 'utf8');
const gate = parseManifest(manifestSource);
const errors = validateGate(gate);

if (coreTouched && errors.length) {
  console.error('[BUILD_GATE_FAIL] Build gate declaration invalid:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `Build gate check passed${coreTouched ? ' (core paths touched — manifest validated)' : ''}.`,
);
