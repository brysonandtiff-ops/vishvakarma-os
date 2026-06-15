#!/usr/bin/env node

import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function readStdin() {
  return new Promise((resolvePromise) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolvePromise(data));
  });
}

function extractFilePath(payload) {
  const candidates = [
    payload.file_path,
    payload.filePath,
    payload.path,
    payload.editedFile,
    payload.file,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function runBiomeLint(relativePath) {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return spawnSync(
    pnpm,
    ['exec', 'biome', 'lint', '--only=correctness/noUndeclaredDependencies', relativePath],
    {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    process.exit(0);
  }

  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath = extractFilePath(payload);
  if (!filePath) {
    process.exit(0);
  }

  const absolute = resolve(root, filePath);
  const relativePath = relative(root, absolute).replaceAll('\\', '/');
  if (!relativePath.startsWith('src/') || !/\.(ts|tsx)$/.test(relativePath)) {
    process.exit(0);
  }

  const result = runBiomeLint(relativePath);
  if (result.status === 0) {
    process.exit(0);
  }

  const snippet = `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(0, 6).join('\n');
  process.stdout.write(
    `${JSON.stringify({
      additional_context: `RepairBot hook: Biome undeclared-deps check failed for ${relativePath}. Run pnpm run repairbot:fast before finishing.\n${snippet}`,
    })}\n`,
  );
  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
