#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pass, fail, warn, info, exitWithFailures } from '../lib/cli.mjs';
import { runCommandSync } from '../lib/run-command.mjs';

const root = process.cwd();
const failures = [];
const warnings = [];

function checkNode() {
  const version = process.version;
  const major = Number.parseInt(version.slice(1).split('.')[0], 10);
  if (major !== 20) {
    warnings.push(`Node ${version} detected — CI uses Node 20.x (see package.json engines)`);
  } else {
    pass('node', version);
  }
}

function checkPnpm() {
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = runCommandSync(pnpmCommand, ['--version'], { shell: process.platform === 'win32' });
  if (!result.ok) {
    warnings.push('pnpm not found on PATH — install pnpm 9.x (corepack enable && corepack prepare pnpm@9.15.0 --activate)');
    return;
  }
  const major = Number.parseInt(result.stdout.split('.')[0], 10);
  if (major < 9) {
    warnings.push(`pnpm ${result.stdout} detected — recommended pnpm 9.15.x`);
  } else {
    pass('pnpm', result.stdout);
  }
}

function parseEnvKeys(content) {
  const keys = new Set();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function checkEnvFiles() {
  const examplePath = join(root, '.env.example');
  const localPath = join(root, '.env.local');
  if (!existsSync(examplePath)) {
    failures.push('Missing .env.example');
    return;
  }

  const exampleKeys = parseEnvKeys(readFileSync(examplePath, 'utf8'));
  pass('env.example', `${exampleKeys.size} keys documented`);

  if (!existsSync(localPath)) {
    warnings.push('.env.local missing — copy from .env.example for full local stack');
    return;
  }

  const localKeys = parseEnvKeys(readFileSync(localPath, 'utf8'));
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  for (const key of required) {
    if (!localKeys.has(key)) {
      warnings.push(`.env.local missing ${key}`);
    }
  }
  pass('env.local', `${localKeys.size} keys configured`);
}

function checkPlaywright() {
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = runCommandSync(pnpmCommand, ['exec', 'playwright', '--version'], {
    shell: process.platform === 'win32',
  });
  if (!result.ok) {
    warnings.push('Playwright CLI unavailable — run pnpm run test:e2e:install');
    return;
  }
  pass('playwright', result.stdout);
}

function checkWorkspaceRoot() {
  const parentPackage = join(root, '..', 'package.json');
  if (!existsSync(parentPackage)) return;
  try {
    const parsed = JSON.parse(readFileSync(parentPackage, 'utf8'));
    if (parsed.name === 'vishvakarma-os' && parsed.private !== true) {
      warnings.push('Parent workspace package.json may be corrupted — run pnpm run repair:workspace-root');
    } else {
      pass('workspace-root', 'parent package.json looks sane');
    }
  } catch {
    warnings.push('Parent workspace package.json is invalid JSON — run pnpm run repair:workspace-root');
  }
}

function checkDistFreshness() {
  const distIndex = join(root, 'dist', 'index.html');
  const srcMain = join(root, 'src', 'main.tsx');
  if (!existsSync(distIndex)) {
    warnings.push('dist/ missing — run pnpm run build');
    return;
  }
  const distMtime = statSync(distIndex).mtimeMs;
  const srcMtime = statSync(srcMain).mtimeMs;
  if (srcMtime > distMtime) {
    warnings.push('dist/ appears stale relative to src/main.tsx — run pnpm run build');
  } else {
    pass('dist', 'build artifact present');
  }
}

function checkSupabaseShape() {
  const localPath = join(root, '.env.local');
  if (!existsSync(localPath)) return;
  const content = readFileSync(localPath, 'utf8');
  const urlMatch = content.match(/^VITE_SUPABASE_URL=(.+)$/m);
  if (urlMatch && !urlMatch[1].includes('supabase.co')) {
    warnings.push('VITE_SUPABASE_URL does not look like a Supabase project URL');
  } else if (urlMatch) {
    pass('supabase-url', 'shape ok');
  }
}

async function main() {
  info('Vishvakarma.OS doctor');
  console.log('');

  checkNode();
  checkPnpm();
  checkEnvFiles();
  checkSupabaseShape();
  checkPlaywright();
  checkWorkspaceRoot();
  checkDistFreshness();

  for (const warning of warnings) warn('doctor', warning);

  if (failures.length > 0) {
    exitWithFailures(failures);
  }

  pass('doctor', warnings.length === 0 ? 'all checks passed' : `${warnings.length} warning(s)`);
}

main().catch((error) => {
  fail('doctor', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
