#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { parseArgs } from '../../lib/cli.mjs';
import { runCommandSync } from '../../lib/run-command.mjs';

const root = process.cwd();

/**
 * @typedef {{ code: string; severity: 'error' | 'warning'; blocking: boolean; message: string }} EnvIssue
 */

/**
 * @returns {{ ok: boolean; issues: EnvIssue[] }}
 */
export function runEnvScan() {
  /** @type {EnvIssue[]} */
  const issues = [];

  const version = process.version;
  const major = Number.parseInt(version.slice(1).split('.')[0], 10);
  if (major !== 20) {
    issues.push({
      code: 'NODE_VERSION_MISMATCH',
      severity: 'warning',
      blocking: false,
      message: `Node ${version} detected — CI uses Node 20.x`,
    });
  }

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const pnpmResult = runCommandSync(pnpmCommand, ['--version'], { shell: process.platform === 'win32' });
  if (!pnpmResult.ok) {
    issues.push({
      code: 'PNPM_MISSING',
      severity: 'warning',
      blocking: false,
      message: 'pnpm not found on PATH',
    });
  } else {
    const pnpmMajor = Number.parseInt(pnpmResult.stdout.split('.')[0], 10);
    if (pnpmMajor < 9) {
      issues.push({
        code: 'PNPM_VERSION_OLD',
        severity: 'warning',
        blocking: false,
        message: `pnpm ${pnpmResult.stdout} detected — recommended pnpm 9.15.x`,
      });
    }
  }

  const examplePath = join(root, '.env.example');
  if (!existsSync(examplePath)) {
    issues.push({
      code: 'ENV_EXAMPLE_MISSING',
      severity: 'error',
      blocking: true,
      message: 'Missing .env.example',
    });
  }

  const parentPackage = join(root, '..', 'package.json');
  if (existsSync(parentPackage)) {
    try {
      const parsed = JSON.parse(readFileSync(parentPackage, 'utf8'));
      if (parsed.name === 'vishvakarma-os' && parsed.private !== true) {
        issues.push({
          code: 'WORKSPACE_ROOT_BAD',
          severity: 'warning',
          blocking: true,
          message: 'Parent workspace package.json may be corrupted',
        });
      }
    } catch {
      issues.push({
        code: 'WORKSPACE_ROOT_INVALID_JSON',
        severity: 'warning',
        blocking: true,
        message: 'Parent workspace package.json is invalid JSON',
      });
    }
  }

  const distIndex = join(root, 'dist', 'index.html');
  const srcMain = join(root, 'src', 'main.tsx');
  if (!existsSync(distIndex)) {
    issues.push({
      code: 'DIST_MISSING',
      severity: 'warning',
      blocking: false,
      message: 'dist/ missing — run pnpm run build',
    });
  } else if (existsSync(srcMain)) {
    const distMtime = statSync(distIndex).mtimeMs;
    const srcMtime = statSync(srcMain).mtimeMs;
    if (srcMtime > distMtime) {
      issues.push({
        code: 'DIST_STALE',
        severity: 'warning',
        blocking: false,
        message: 'dist/ appears stale relative to src/main.tsx',
      });
    }
  }

  const playwrightResult = runCommandSync(pnpmCommand, ['exec', 'playwright', '--version'], {
    shell: process.platform === 'win32',
  });
  if (!playwrightResult.ok) {
    issues.push({
      code: 'PLAYWRIGHT_MISSING',
      severity: 'warning',
      blocking: false,
      message: 'Playwright CLI unavailable',
    });
  }

  const blockingIssues = issues.filter((issue) => issue.blocking);
  const hasErrors = issues.some((issue) => issue.severity === 'error');
  return { ok: !hasErrors && blockingIssues.length === 0, issues };
}

function main() {
  const { flags } = parseArgs();
  const result = runEnvScan();

  if (flags.has('json')) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exit(result.ok ? 0 : 1);
  }

  for (const issue of result.issues) {
    const label = issue.severity === 'error' ? 'FAIL' : 'WARN';
    console.log(`${label} env-scan:${issue.code} — ${issue.message}`);
  }

  process.exit(result.ok ? 0 : 1);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) {
  main();
}
