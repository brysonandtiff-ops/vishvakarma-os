#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { exitWithFailures, pass, fail } from '../lib/cli.mjs';

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(path, 'utf8');
}

const envExamplePath = join(root, '.env.example');
const monitoringPath = join(root, 'src', 'lib', 'monitoring.ts');
const packageJsonPath = join(root, 'package.json');

if (!existsSync(envExamplePath)) {
  failures.push('Missing .env.example');
} else {
  const envExample = read(envExamplePath);
  if (!envExample.includes('VITE_SENTRY_DSN')) {
    failures.push('.env.example must document optional VITE_SENTRY_DSN');
  }
}

if (!existsSync(monitoringPath)) {
  failures.push('Missing src/lib/monitoring.ts');
} else {
  const monitoring = read(monitoringPath);
  if (!monitoring.includes('initMonitoring')) {
    failures.push('monitoring.ts must export initMonitoring()');
  }
  if (!monitoring.includes('captureException')) {
    failures.push('monitoring.ts must export captureException()');
  }
}

const packageJson = JSON.parse(read(packageJsonPath));
const hasSentryDep = Boolean(packageJson.dependencies?.['@sentry/react'] || packageJson.devDependencies?.['@sentry/react']);

if (!hasSentryDep) {
  failures.push('package.json must include @sentry/react dependency for monitoring gate');
}

if (hasSentryDep && existsSync(monitoringPath)) {
  const monitoring = read(monitoringPath);
  if (!monitoring.includes('Sentry.init') && !monitoring.includes('@sentry/react')) {
    failures.push('monitoring.ts must wire @sentry/react when VITE_SENTRY_DSN is present');
  }
}

if (failures.length > 0) {
  fail('monitoring-gate', `${failures.length} issue(s)`);
  exitWithFailures(failures);
}

pass('monitoring-gate', '@sentry/react documented and wired');
