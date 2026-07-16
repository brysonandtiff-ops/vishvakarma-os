#!/usr/bin/env node

const branch = process.env.VERCEL_GIT_COMMIT_REF?.trim() || '';
const knownPhases = [
  'app-services',
  'app-editor',
  'perf-auth',
  'app-ui',
  'firefox',
  'webkit',
  'release',
  'evidence',
  'auth',
  'a11y',
];

const marker = 'agent/direct-cert-';
const remainder = branch.startsWith(marker) ? branch.slice(marker.length) : '';
const phase = knownPhases.find((candidate) => remainder === candidate || remainder.startsWith(`${candidate}-`));

if (!phase) {
  throw new Error(`Unable to infer certification phase from branch: ${branch || '(empty)'}`);
}

process.env.CERT_PHASE = phase;
console.log(`[direct-cert] inferred phase ${phase} from ${branch}`);
await import('./run-direct-certification-phase.mjs');
