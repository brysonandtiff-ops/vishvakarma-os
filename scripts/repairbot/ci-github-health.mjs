#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { fail, info, pass, warn } from '../lib/cli.mjs';

function gh(args) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString?.() ?? String(error);
    throw new Error(stderr || 'gh command failed');
  }
}

function main() {
  info('GitHub Actions health');

  let runs;
  try {
    runs = JSON.parse(
      gh([
        'run',
        'list',
        '--limit',
        '5',
        '--json',
        'conclusion,workflowName,displayTitle,createdAt,event,workflowDatabaseId',
      ]),
    );
  } catch (error) {
    fail('ci-github', `gh unavailable: ${error.message}`);
    process.exit(1);
  }

  if (!runs.length) {
    warn('ci-github', 'no recent workflow runs found');
    process.exit(0);
  }

  const startupFailures = runs.filter((run) => run.conclusion === 'startup_failure');
  const unnamedRuns = runs.filter((run) => !run.workflowName);

  for (const run of runs) {
    const label = run.conclusion === 'success' ? 'PASS' : run.conclusion === 'startup_failure' ? 'FAIL' : 'WARN';
    const name = run.workflowName || run.displayTitle;
    console.log(`  ${label} ${name} (${run.event}, ${run.conclusion})`);
  }

  if (startupFailures.length === runs.length) {
    fail(
      'ci-github',
      'all recent runs are startup_failure (0 jobs) — check GitHub billing/Actions quota and the deleted BuildFailed workflow ghost',
    );
    console.log('');
    console.log('Manual checks:');
    console.log('  1. GitHub → Settings → Billing → Actions minutes / spending limit');
    console.log('  2. Repo → Settings → Actions → General → ensure Actions enabled');
    console.log('  3. Actions tab → delete or disable stale "BuildFailed" workflow if shown');
    console.log('  4. workflow_dispatch "CI Health Probe" — should echo ok when account is healthy');
    process.exit(1);
  }

  if (buildFailedGhost.length) {
    warn('ci-github', `${buildFailedGhost.length} push run(s) hit deleted BuildFailed workflow — real workflows may not be dispatching on push`);
  }

  pass('ci-github', 'at least one recent run is not startup_failure');
}

main();
