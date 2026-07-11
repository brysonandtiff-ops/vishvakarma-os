#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { runInNewContext } from 'node:vm';
import { exitWithFailures, fail, pass } from '../lib/cli.mjs';
import { formatBytes } from '../lib/parse-dist-assets.mjs';
import { getCommitSha } from '../lib/run-command.mjs';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const serviceWorkerPath = join(distDir, 'sw.js');
const budgetPath = join(root, 'scripts', 'performance', 'bundle-budget.json');
const reportPath = join(root, 'docs', 'release', 'evidence', 'pwa-precache-report.json');
const forbiddenPrefixes = ['textures/', 'models/', 'hdri/', 'audio/', 'splash/'];

function extractPrecacheLiteral(source) {
  const callIndex = source.indexOf('precacheAndRoute(');
  if (callIndex < 0) {
    throw new Error('precacheAndRoute() call not found in dist/sw.js');
  }

  const start = source.indexOf('[', callIndex);
  if (start < 0) {
    throw new Error('precache manifest array not found in dist/sw.js');
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error('unterminated precache manifest array in dist/sw.js');
}

function parsePrecacheEntries(source) {
  const literal = extractPrecacheLiteral(source);
  const entries = runInNewContext(`(${literal})`, Object.create(null), { timeout: 1_000 });
  if (!Array.isArray(entries)) {
    throw new Error('precache manifest did not evaluate to an array');
  }
  return entries;
}

function entryUrl(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof entry.url === 'string') return entry.url;
  return null;
}

function normalizeLocalUrl(url) {
  const withoutQuery = url.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  if (!withoutQuery || /^[a-z][a-z\d+.-]*:/i.test(withoutQuery)) return null;
  return decodeURIComponent(withoutQuery);
}

async function main() {
  const failures = [];

  if (!existsSync(serviceWorkerPath)) {
    failures.push('dist/sw.js missing — run pnpm run build first');
    exitWithFailures(failures);
  }

  const [source, budget, commit] = await Promise.all([
    readFile(serviceWorkerPath, 'utf8'),
    readFile(budgetPath, 'utf8').then(JSON.parse),
    getCommitSha(),
  ]);

  const entries = parsePrecacheEntries(source);
  const urls = entries.map(entryUrl).filter(Boolean);
  const counts = new Map();

  for (const url of urls) {
    counts.set(url, (counts.get(url) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }));

  if (duplicates.length > 0) {
    failures.push(
      `precache contains duplicate URLs: ${duplicates.map(({ url, count }) => `${url} (${count}x)`).join(', ')}`,
    );
  }

  const forbidden = [...counts.keys()].filter((url) => {
    const normalized = normalizeLocalUrl(url);
    return normalized && forbiddenPrefixes.some((prefix) => normalized.startsWith(prefix));
  });

  if (forbidden.length > 0) {
    failures.push(`heavy runtime-cached assets leaked into precache: ${forbidden.join(', ')}`);
  }

  let totalBytes = 0;
  const missingFiles = [];

  for (const url of counts.keys()) {
    const normalized = normalizeLocalUrl(url);
    if (!normalized) continue;

    const filePath = resolve(distDir, normalized);
    if (filePath !== distDir && !filePath.startsWith(`${distDir}${sep}`)) {
      failures.push(`precache URL escapes dist/: ${url}`);
      continue;
    }

    try {
      totalBytes += (await stat(filePath)).size;
    } catch {
      missingFiles.push(url);
    }
  }

  if (missingFiles.length > 0) {
    failures.push(`precache references missing dist files: ${missingFiles.join(', ')}`);
  }

  const maxBytes = (budget.pwaPrecacheMb ?? 24) * 1024 * 1024;
  const maxEntries = budget.pwaPrecacheEntries ?? 160;

  if (totalBytes > maxBytes) {
    failures.push(`precache ${formatBytes(totalBytes)} exceeds budget ${formatBytes(maxBytes)}`);
  }
  if (counts.size > maxEntries) {
    failures.push(`precache ${counts.size} unique entries exceeds budget ${maxEntries}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    commit,
    uniqueEntries: counts.size,
    declaredEntries: urls.length,
    totalBytes,
    totalMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    maxBytes,
    maxEntries,
    forbiddenPrefixes,
    duplicates,
    forbidden,
    missingFiles,
    passed: failures.length === 0,
    failures,
  };

  await mkdir(join(root, 'docs', 'release', 'evidence'), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${reportPath}`);

  if (failures.length > 0) {
    fail('pwa-precache', `${failures.length} violation(s)`);
    exitWithFailures(failures);
  }

  pass('pwa-precache', `${counts.size} entries, ${formatBytes(totalBytes)}`);
}

main().catch((error) => {
  fail('pwa-precache', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
