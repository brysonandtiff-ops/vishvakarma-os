#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { exitWithFailures, fail, pass } from '../lib/cli.mjs';
import { getCommitSha } from '../lib/run-command.mjs';

const root = process.cwd();
const apiRoot = join(root, 'api');
const policyPath = join(apiRoot, 'endpoint-policy.json');
const reportPath = join(root, 'docs', 'release', 'evidence', 'api-endpoint-inventory.json');
const endpointExtensions = new Set(['.ts', '.js', '.mjs', '.cjs']);

async function listEndpointFiles(directory = apiRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '_lib') continue;
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listEndpointFiles(entryPath));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!endpointExtensions.has(extname(entry.name))) continue;
    if (/\.(?:test|spec)\.[cm]?[jt]s$/i.test(entry.name)) continue;
    files.push(relative(apiRoot, entryPath).split(sep).join('/'));
  }
  return files.sort();
}

function requireSource(source, phrase, path, failures) {
  if (!source.includes(phrase)) failures.push(`${path}: missing ${phrase}`);
}

function auditEndpoint(path, policy, source, failures) {
  requireSource(source, 'export default', path, failures);

  for (const method of policy.methods ?? []) {
    if (!source.includes(`'${method}'`) && !source.includes(`\"${method}\"`)) {
      failures.push(`${path}: method ${method} is declared but not enforced in source`);
    }
  }

  if (policy.cache === 'no-store') {
    const hasNoStore =
      source.includes('applyApiSecurityHeaders') ||
      source.includes("'Cache-Control', 'no-store'") ||
      source.includes("'Cache-Control', 'private, no-store");
    if (!hasNoStore) failures.push(`${path}: no-store response policy is missing`);
  }

  if (policy.auth === 'google-supabase') {
    requireSource(source, 'verifyAuthTokenFromRequest', path, failures);
    requireSource(source, 'parseBoundedJsonBody', path, failures);
  } else if (policy.auth === 'stripe-signature') {
    requireSource(source, 'stripe-signature', path, failures);
    requireSource(source, 'constructEvent', path, failures);
    requireSource(source, 'MAX_STRIPE_WEBHOOK_BYTES', path, failures);
    if (!policy.publicReason) failures.push(`${path}: public webhook requires publicReason`);
  } else if (policy.auth === 'public') {
    if (!policy.publicReason) failures.push(`${path}: public endpoint requires publicReason`);
  } else {
    failures.push(`${path}: unsupported auth policy ${String(policy.auth)}`);
  }

  if (!Number.isInteger(policy.bodyLimitBytes) || policy.bodyLimitBytes <= 0) {
    failures.push(`${path}: bodyLimitBytes must be a positive integer`);
  }

  if (policy.errorExposure !== 'generic') {
    failures.push(`${path}: errorExposure must be generic`);
  }
  if (/error\s*:\s*error\s+instanceof\s+Error\s*\?\s*error\.message/.test(source)) {
    failures.push(`${path}: leaks arbitrary internal Error.message values`);
  }
  if (/error\s*:\s*String\(error\)/.test(source)) {
    failures.push(`${path}: leaks arbitrary internal errors`);
  }
}

async function main() {
  const failures = [];
  if (!existsSync(policyPath)) {
    exitWithFailures(['api/endpoint-policy.json is missing']);
  }

  const [files, policy, commit] = await Promise.all([
    listEndpointFiles(),
    readFile(policyPath, 'utf8').then(JSON.parse),
    getCommitSha(),
  ]);
  const declared = Object.keys(policy).sort();

  for (const path of files) {
    if (!policy[path]) failures.push(`${path}: endpoint is missing from endpoint-policy.json`);
  }
  for (const path of declared) {
    if (!files.includes(path)) failures.push(`${path}: policy references a missing endpoint`);
  }

  const audited = [];
  for (const path of files) {
    const endpointPolicy = policy[path];
    if (!endpointPolicy) continue;
    const source = await readFile(join(apiRoot, path), 'utf8');
    const before = failures.length;
    auditEndpoint(path, endpointPolicy, source, failures);
    audited.push({
      path,
      ...endpointPolicy,
      passed: failures.length === before,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    commit,
    endpointCount: files.length,
    endpoints: audited,
    passed: failures.length === 0,
    failures,
  };
  await mkdir(join(root, 'docs', 'release', 'evidence'), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${reportPath}`);

  if (failures.length > 0) {
    fail('api-endpoints', `${failures.length} violation(s)`);
    exitWithFailures(failures);
  }

  pass('api-endpoints', `${files.length} endpoint(s) fully inventoried`);
}

main().catch((error) => {
  fail('api-endpoints', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
