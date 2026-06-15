#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, pass, fail, info } from './lib/cli.mjs';
import { runCommand } from './lib/run-command.mjs';

const manifestPath = join(process.cwd(), 'scripts', 'lib', 'pipeline-manifest.json');

function loadManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function resolveTierSteps(manifest, tierName) {
  const tier = manifest.tiers[tierName];
  if (!tier) {
    throw new Error(`Unknown pipeline tier: ${tierName}`);
  }
  return tier.steps ?? [];
}

async function main() {
  const { options } = parseArgs();
  const tierName = options.tier ?? options.t;
  if (!tierName) {
    console.error('Usage: node scripts/run-pipeline.mjs --tier=<name>');
    console.error('Tiers: verify, verify:ci, ci, release, post-deploy');
    process.exit(1);
  }

  const manifest = loadManifest();
  const steps = resolveTierSteps(manifest, tierName);
  const tier = manifest.tiers[tierName];

  info(`Pipeline tier: ${tierName}`);
  if (tier.description) info(tier.description);
  console.log('');

  for (const [index, step] of steps.entries()) {
    info(`[${index + 1}/${steps.length}] ${step}`);
    try {
      runCommand(step, { stdio: 'inherit' });
      pass(step);
    } catch (error) {
      fail(step, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    console.log('');
  }

  pass(`pipeline:${tierName}`, `${steps.length} steps completed`);
}

main().catch((error) => {
  fail('pipeline', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
