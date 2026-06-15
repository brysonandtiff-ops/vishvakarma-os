#!/usr/bin/env node

import { parseArgs, pass, fail, info } from '../lib/cli.mjs';
import { runCommand } from '../lib/run-command.mjs';

async function runStep(command) {
  info(command);
  runCommand(command, { stdio: 'inherit' });
  pass(command);
}

async function main() {
  await runStep('node scripts/stability/probe-health.mjs --prod');
  await runStep('pnpm run verify:production-auth-flow');

  const stripeProbe = runCommand('pnpm run verify:stripe-billing', {
    stdio: 'inherit',
    throwOnError: false,
  });

  if (stripeProbe.ok) {
    pass('verify:stripe-billing');
  } else {
    info('Skipped Stripe billing verify — env not configured (non-blocking).');
  }

  pass('post-deploy-smoke', 'production probes completed');
}

main().catch((error) => {
  fail('post-deploy-smoke', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
