#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'docs/FLAWLESS_USE_VALUE_PLAN.md',
  'docs/FLAWLESS_USE_IMPLEMENTATION_GATES.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
];

const requiredPhrases = new Map([
  [
    'docs/FLAWLESS_USE_VALUE_PLAN.md',
    [
      'Core workflow',
      'Value gates',
      'Canonical ProjectModel proof',
      '2D to 3D sync evidence',
    ],
  ],
  [
    'docs/FLAWLESS_USE_IMPLEMENTATION_GATES.md',
    [
      'No duplicate geometry or project truth',
      'Required PR fields',
      'Verification floor',
      'Professional export proof',
    ],
  ],
  [
    '.github/PULL_REQUEST_TEMPLATE.md',
    [
      'Product value',
      'Build doctrine',
      'Flawless-use impact',
      'Stop-ship checks',
      'Rollback',
    ],
  ],
]);

const failures = [];

for (const file of requiredFiles) {
  const absolute = join(root, file);

  if (!existsSync(absolute)) {
    failures.push(`Missing required flawless-use file: ${file}`);
    continue;
  }

  const content = readFileSync(absolute, 'utf8');
  const phrases = requiredPhrases.get(file) ?? [];

  for (const phrase of phrases) {
    if (!content.includes(phrase)) {
      failures.push(`${file} is missing required phrase: ${phrase}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS flawless-use gate check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS flawless-use gate check passed.');
console.log('Required value plan, implementation gates, and PR template are present.');
