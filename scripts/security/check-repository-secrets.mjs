#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const SELF_PATH = 'scripts/security/check-repository-secrets.mjs';
const BUILD_PRUNED_PREFIXES = ['public/textures/'];
const ALLOWED_TRACKED_ENV_PATHS = new Set([
  '.env.e2e',
  '.env.e2e-local',
  'config/e2e-env/.env',
]);
const SENSITIVE_ENV_KEYS = new Set([
  'VERCEL_OIDC_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'SUPABASE_AUTH_GOOGLE_SECRET',
  'GOOGLE_CLIENT_SECRET',
]);

const allowedEnvFiles = new Set(['.env.example']);
const allowedEnvPattern = /^\.env\..+\.example$/;
const placeholderValuePattern = /^(?:|your-|replace-with-|placeholder|example|<)/i;

const secretRules = [
  {
    name: 'private key material',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'Stripe secret key',
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/,
  },
  {
    name: 'Stripe webhook secret',
    pattern: /\bwhsec_[A-Za-z0-9]{20,}\b/,
  },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/,
  },
  {
    name: 'service-account JSON',
    pattern: /["']type["']\s*:\s*["']service_account["'][\s\S]{0,4000}["']private_key["']\s*:/,
  },
];

function listTrackedFiles() {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`git ls-files failed with exit ${result.status}`);
  }

  return result.stdout.split('\0').filter(Boolean);
}

function isEnvLikePath(path) {
  return basename(path) === '.env' || basename(path).startsWith('.env.');
}

function isForbiddenEnvFile(path) {
  if (ALLOWED_TRACKED_ENV_PATHS.has(path)) return false;
  const fileName = basename(path);
  if (allowedEnvFiles.has(fileName) || allowedEnvPattern.test(fileName)) return false;
  return isEnvLikePath(path);
}

function isExpectedBuildPrunedFile(path) {
  return BUILD_PRUNED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8 * 1024));
  return sample.includes(0);
}

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function scanSensitiveEnvAssignments(path, text) {
  if (!isEnvLikePath(path)) return [];

  const findings = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim().replace(/^export\s+/, '');
    if (!SENSITIVE_ENV_KEYS.has(key)) continue;

    const value = stripWrappingQuotes(line.slice(separator + 1));
    if (!placeholderValuePattern.test(value)) {
      findings.push({ path, name: `non-placeholder ${key}` });
    }
  }

  return findings;
}

async function scanFile(path) {
  if (path === SELF_PATH) return [];

  let buffer;
  try {
    buffer = await readFile(path);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT' &&
      isExpectedBuildPrunedFile(path)
    ) {
      return [];
    }
    throw error;
  }

  if (buffer.length > MAX_TEXT_FILE_BYTES || looksBinary(buffer)) return [];

  const text = buffer.toString('utf8');
  return [
    ...secretRules
      .filter(({ pattern }) => pattern.test(text))
      .map(({ name }) => ({ path, name })),
    ...scanSensitiveEnvAssignments(path, text),
  ];
}

async function main() {
  const files = listTrackedFiles();
  const findings = [];

  for (const path of files) {
    if (isForbiddenEnvFile(path)) {
      findings.push({ path, name: 'tracked local environment file' });
      continue;
    }

    findings.push(...(await scanFile(path)));
  }

  if (findings.length > 0) {
    console.error('FAIL repository-secret-guard');
    for (const finding of findings) {
      console.error(`- ${finding.path}: ${finding.name}`);
    }
    console.error('Move credentials to encrypted deployment variables and rotate exposed values.');
    process.exit(1);
  }

  console.log(`PASS repository-secret-guard — ${files.length} tracked file(s) checked`);
}

main().catch((error) => {
  console.error(
    'FAIL repository-secret-guard:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
