#!/usr/bin/env node
/**
 * Validates system-map.json aligns with src/core-contract/system.schema.ts versions.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mapPath = join(root, 'system-map.json');
const schemaPath = join(root, 'src', 'core-contract', 'system.schema.ts');
const anchorPath = join(root, 'tests', 'anchors', 'system-versions.json');

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const anchor = JSON.parse(readFileSync(anchorPath, 'utf8'));
const schemaSource = readFileSync(schemaPath, 'utf8');

const versionMatch = schemaSource.match(
  /SYSTEM_VERSIONS[\s\S]*?ARCHITECTURE_COPILOT:\s*'([^']+)'[\s\S]*?OPTIMIZATION_ENGINE:\s*'([^']+)'[\s\S]*?COST_INTELLIGENCE:\s*'([^']+)'[\s\S]*?COMPLIANCE_GATE:\s*'([^']+)'[\s\S]*?COUNCIL_INTELLIGENCE:\s*'([^']+)'/,
);

if (!versionMatch) {
  console.error('check-system-contract: could not parse SYSTEM_VERSIONS from system.schema.ts');
  process.exit(1);
}

const expected = {
  ARCHITECTURE_COPILOT: versionMatch[1],
  OPTIMIZATION_ENGINE: versionMatch[2],
  COST_INTELLIGENCE: versionMatch[3],
  COMPLIANCE_GATE: versionMatch[4],
  COUNCIL_INTELLIGENCE: versionMatch[5],
};

const errors = [];

if (map.version !== anchor.systemMapVersion) {
  errors.push(`system-map version ${map.version} !== anchor ${anchor.systemMapVersion}`);
}

for (const [moduleId, version] of Object.entries(expected)) {
  const mapModule = map.modules?.[moduleId];
  if (!mapModule) {
    errors.push(`system-map missing module ${moduleId}`);
    continue;
  }
  if (mapModule.version !== version) {
    errors.push(`system-map ${moduleId}=${mapModule.version} expected ${version}`);
  }
  if (anchor.modules[moduleId] !== version) {
    errors.push(`anchor ${moduleId}=${anchor.modules[moduleId]} expected ${version}`);
  }
}

const requiredEdges = [
  'INPUT→ARCHITECTURE_COPILOT',
  'ARCHITECTURE_COPILOT→OPTIMIZATION_ENGINE',
  'COMPLIANCE_GATE→PERMIT_PACKAGE_EXPORT',
];

for (const edge of requiredEdges) {
  if (!map.allowed_edges?.includes(edge)) {
    errors.push(`system-map missing allowed edge: ${edge}`);
  }
}

const forbiddenCostEdges = [
  'COST_INTELLIGENCE→layoutSolver',
  'COST_INTELLIGENCE→constraintEngine',
  'COST_INTELLIGENCE→adjacencySolver',
];

for (const edge of forbiddenCostEdges) {
  if (!map.forbidden_edges?.includes(edge)) {
    errors.push(`system-map missing forbidden edge: ${edge}`);
  }
}

if (errors.length) {
  console.error('System contract check failed:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('System contract check passed (system-map.json ↔ SYSTEM_VERSIONS ↔ anchors).');
