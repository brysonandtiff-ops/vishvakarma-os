#!/usr/bin/env node
/**
 * Forbidden-edge firewall: cost intelligence must not import layout generation solvers.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const costDir = join(root, 'src', 'services', 'cost-estimation');

const FORBIDDEN_IMPORT_PATTERNS = [
  'layoutSolver',
  'constraintEngine',
  'adjacencySolver',
  '/ai/building-designer/generators/',
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of walk(costDir)) {
  const source = readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
    if (source.includes(pattern)) {
      violations.push(`${file}: forbidden import/reference "${pattern}"`);
    }
  }
}

if (violations.length) {
  console.error('Forbidden edge check failed (COST_INTELLIGENCE → layout):');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log('Forbidden edge check passed (cost-estimation has no layout solver imports).');
