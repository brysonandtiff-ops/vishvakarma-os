#!/usr/bin/env node

const branch = process.env.VERCEL_GIT_COMMIT_REF?.trim() || '';
const prefix = 'agent/direct-cert-';
const suffix = '-v1.5.0-20260717';

if (!branch.startsWith(prefix) || !branch.endsWith(suffix)) {
  throw new Error(`Unable to infer certification phase from branch: ${branch || '(empty)'}`);
}

const phase = branch.slice(prefix.length, -suffix.length);
process.env.CERT_PHASE = phase;
console.log(`[direct-cert] inferred phase ${phase} from ${branch}`);
await import('./run-direct-certification-phase.mjs');
