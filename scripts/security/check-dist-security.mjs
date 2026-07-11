#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { exitWithFailures, fail, pass } from '../lib/cli.mjs';

const root = process.cwd();
const distDir = join(root, 'dist');
const isVercelBuild = process.env.VERCEL === '1';
const allowSourceMaps =
  process.env.VISH_BUILD_SOURCEMAPS === 'true' && !isVercelBuild;
const qaToolsEnabled = process.env.VITE_ENABLE_QA_TOOLS === 'true';
const textExtensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.json',
  '.webmanifest',
  '.txt',
]);

const forbiddenSecretPatterns = [
  {
    label: 'private key material',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    label: 'OpenAI secret key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    label: 'Anthropic secret key',
    pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    label: 'Stripe secret key',
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    label: 'server-only environment variable name',
    pattern:
      /\b(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|DATABASE_URL)\b/g,
  },
];

const productionQaMarkers = [
  'vish-device-validation-v1',
  'vish:open-qa-evidence',
  'vish:open-ipad-touch-audit',
  'Device validation proof mode',
];

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0
      ? ''
      : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function findServiceRoleJwt(content) {
  const jwtPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
  for (const token of content.match(jwtPattern) ?? []) {
    try {
      const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));
      if (payload?.role === 'service_role') return token.slice(0, 18);
    } catch {
      // Ignore non-JWT strings that happen to match the token shape.
    }
  }
  return null;
}

async function main() {
  const failures = [];
  if (!existsSync(distDir)) {
    failures.push('dist/ is missing — run pnpm run build before security:gates');
    exitWithFailures(failures);
  }

  const files = await listFiles(distDir);
  const sourceMaps = files.filter((file) => extname(file) === '.map');
  if (!allowSourceMaps && sourceMaps.length > 0) {
    failures.push(
      `source maps are present in deploy output: ${sourceMaps
        .map((file) => relative(distDir, file))
        .join(', ')}`,
    );
  }

  for (const file of files) {
    if (!textExtensions.has(extname(file))) continue;
    const content = await readFile(file, 'utf8');
    const displayPath = relative(distDir, file);

    for (const { label, pattern } of forbiddenSecretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        failures.push(`${displayPath} contains ${label}`);
      }
    }

    const serviceRolePrefix = findServiceRoleJwt(content);
    if (serviceRolePrefix) {
      failures.push(
        `${displayPath} contains a Supabase service_role JWT (${serviceRolePrefix}…)`,
      );
    }

    if (!qaToolsEnabled) {
      for (const marker of productionQaMarkers) {
        if (content.includes(marker)) {
          failures.push(`${displayPath} exposes production QA marker: ${marker}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    fail('dist-security', `${failures.length} violation(s)`);
    exitWithFailures([...new Set(failures)]);
  }

  pass(
    'dist-security',
    `${files.length} files scanned; no secrets, public source maps, service-role JWTs, or QA leakage`,
  );
}

main().catch((error) => {
  fail('dist-security', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
