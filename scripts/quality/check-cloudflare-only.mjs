#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const legacyProvider = ['ver', 'cel'].join('');
const marker = legacyProvider.toLowerCase();

const operationalPrefixes = [
  'src/',
  'api/',
  'functions/',
  'cloudflare/',
  'scripts/',
  'public/',
];

const operationalRootFiles = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'vite.config.ts',
  'wrangler.jsonc',
  'index.html',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.api-check.json',
  'tsconfig.check.json',
  'tsconfig.node.json',
]);

const textExtensions = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.jsonc', '.yaml', '.yml', '.toml',
  '.css', '.html', '.sh', '.ps1', '.md', '.txt',
]);

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return output.split('\0').filter(Boolean);
}

function isOperational(path) {
  return operationalRootFiles.has(path) ||
    operationalPrefixes.some((prefix) => path.startsWith(prefix));
}

const failures = [];
let scanned = 0;

for (const path of trackedFiles().filter(isOperational)) {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes(marker)) {
    failures.push(`legacy hosting provider appears in operational path: ${path}`);
    continue;
  }

  if (!textExtensions.has(extname(path)) && !operationalRootFiles.has(path)) continue;

  const content = readFileSync(path, 'utf8');
  scanned += 1;
  if (content.toLowerCase().includes(marker)) {
    failures.push(`legacy hosting provider appears in operational content: ${path}`);
  }
}

if (failures.length > 0) {
  console.error('Cloudflare-only authority guard FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Cloudflare-only authority guard PASSED — ${scanned} operational text file(s) scanned`);
