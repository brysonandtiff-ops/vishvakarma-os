#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { info, pass, warn, fail } from '../lib/cli.mjs';

const root = process.cwd();
const lastRunPath = join(root, '.repairbot', 'last-run.json');

function main() {
  if (!existsSync(lastRunPath)) {
    warn('repairbot:status', 'no runs yet — try pnpm run repairbot');
    process.exit(0);
  }

  const payload = JSON.parse(readFileSync(lastRunPath, 'utf8'));
  info('RepairBot status');
  console.log('');
  console.log(`Last run: ${payload.at}`);
  console.log(`Tier: ${payload.tier}`);
  console.log(`Duration: ${payload.durationMs}ms`);
  console.log(`Dry run: ${payload.dryRun ? 'yes' : 'no'}`);

  if (payload.ok) {
    pass('health', 'repo checks passed');
  } else {
    fail('health', payload.stoppedAt ? `blocked at ${payload.stoppedAt}` : 'checks failed');
  }

  if (payload.repairs?.length) {
    console.log('');
    info('Repairs');
    for (const repair of payload.repairs) {
      const label = repair.ok ? 'PASS' : 'FAIL';
      console.log(`  ${label} ${repair.id}${repair.dryRun ? ' (dry-run)' : ''}`);
    }
  }

  if (payload.escalations?.length) {
    console.log('');
    warn('escalations', `${payload.escalations.length} item(s) need agent/human review`);
    for (const item of payload.escalations) {
      console.log(`  - ${item.step}: ${item.codes.join(', ') || 'unclassified'}`);
    }
  }

  process.exit(payload.ok ? 0 : 1);
}

main();
