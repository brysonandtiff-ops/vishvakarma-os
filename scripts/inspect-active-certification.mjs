#!/usr/bin/env node

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'e2e', 'docs'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.md']);
const terms = [
  'Follow presenter',
  'cast-viewer-controls',
  'Device marketing layout',
  'landing page fits',
  'full customer audit',
  'iPad editor',
];

async function walk(root) {
  const found = [];
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      found.push(...await walk(fullPath));
    } else if (allowedExtensions.has(path.extname(entry.name))) {
      found.push(fullPath);
    }
  }
  return found;
}

async function main() {
  const allFiles = [];
  for (const root of roots) allFiles.push(...await walk(root));
  if (await stat('README.md').catch(() => null)) allFiles.push('README.md');

  const matches = [];
  const matchingFiles = [];
  const contents = {};
  const evidenceReadmes = [];

  for (const file of allFiles) {
    const text = await readFile(file, 'utf8').catch(() => '');
    const hitTerms = terms.filter((term) => text.toLowerCase().includes(term.toLowerCase()));
    if (hitTerms.length) {
      matchingFiles.push(file);
      contents[file] = text.slice(0, 30000);
      text.split('\n').forEach((line, index) => {
        if (hitTerms.some((term) => line.toLowerCase().includes(term.toLowerCase()))) {
          matches.push(`${file}:${index + 1}:${line.trim()}`);
        }
      });
    }

    const normalized = file.toLowerCase();
    if (
      normalized.endsWith('/readme.md') ||
      normalized.includes('evidence') ||
      normalized.includes('readiness') ||
      normalized.includes('truth')
    ) {
      evidenceReadmes.push(file);
    }
  }

  const result = {
    matches: matches.slice(0, 800),
    matchingFiles,
    contents,
    evidenceReadmes: evidenceReadmes.sort().slice(0, 500),
    inspectedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));
  await mkdir('dist', { recursive: true });
  const escaped = JSON.stringify(result, null, 2)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  await writeFile('dist/index.html', `<pre>${escaped}</pre>`, 'utf8');
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
