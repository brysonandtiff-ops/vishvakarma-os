#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict') || process.env.LAUNCH_EVIDENCE_STRICT === '1';

const requiredFiles = [
  'docs/LAUNCH_READINESS.md',
  'docs/release/evidence/README.md',
  'docs/release/evidence/latest-ci-run.md',
  'docs/release/evidence/security-headers.md',
  'docs/release/evidence/supabase-production-check.md',
  'docs/release/evidence/save-load-proof.md',
  'docs/release/evidence/2d-3d-parity-proof.md',
  'docs/release/evidence/ipad-touch-audit.md',
  'docs/release/evidence/performance-notes.md',
];

const requiredPhrases = new Map([
  ['docs/LAUNCH_READINESS.md', ['Public production launch', 'Blocked until manual evidence is complete', 'Stop-Ship Conditions']],
  ['docs/release/evidence/README.md', ['Minimum Public Launch Bundle', 'Do not mark production ready']],
  ['docs/release/evidence/latest-ci-run.md', ['Workflow Run', 'Command Parity']],
  ['docs/release/evidence/security-headers.md', ['Content-Security-Policy', 'Strict-Transport-Security']],
  ['docs/release/evidence/supabase-production-check.md', ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'Do not paste secret values']],
  ['docs/release/evidence/save-load-proof.md', ['Save / Load Determinism Proof', 'Compare wall/opening counts']],
  ['docs/release/evidence/2d-3d-parity-proof.md', ['2D / 3D Parity Proof', 'WebGL fallback safe']],
  ['docs/release/evidence/ipad-touch-audit.md', ['iPad / Touch Target Audit', 'Minimum 44x44 px target']],
  ['docs/release/evidence/performance-notes.md', ['Performance Notes', 'Runtime Interaction Checks']],
]);

const hardFailures = [];
const strictFailures = [];

for (const file of requiredFiles) {
  const absolute = join(root, file);
  if (!existsSync(absolute)) {
    hardFailures.push(`Missing required launch evidence file: ${file}`);
    continue;
  }

  const content = readFileSync(absolute, 'utf8');
  const phrases = requiredPhrases.get(file) ?? [];
  for (const phrase of phrases) {
    if (!content.includes(phrase)) {
      hardFailures.push(`${file} is missing required phrase: ${phrase}`);
    }
  }

  if (strict) {
    const placeholders = ['<sha>', '<url>', '<timestamp>', '<name>', 'Pending'];
    for (const placeholder of placeholders) {
      if (content.includes(placeholder)) {
        strictFailures.push(`${file} still contains launch placeholder: ${placeholder}`);
      }
    }
  }
}

if (hardFailures.length > 0 || strictFailures.length > 0) {
  console.error('Vishvakarma.OS launch evidence check failed.');
  for (const failure of hardFailures) console.error(`- ${failure}`);
  for (const failure of strictFailures) console.error(`- ${failure}`);
  if (!strict && strictFailures.length === 0) {
    console.error('Run with --strict only when real launch evidence has been filled.');
  }
  process.exit(1);
}

console.log('Vishvakarma.OS launch evidence check passed.');
if (strict) {
  console.log('Strict mode: required evidence files contain no launch placeholders.');
} else {
  console.log('Template mode: required evidence files exist and contain required structure.');
}
