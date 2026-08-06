#!/usr/bin/env node
/**
 * E2E spec integrity gate.
 *
 * Playwright only reports a broken spec import when the suite actually runs, so a
 * helper deleted by an unrelated refactor can silently disable whole spec files for
 * weeks (this happened in 6e5147ce, which dropped 11 helper exports and killed the
 * device/iPad suites). `playwright test --list` type-checks and imports every spec
 * without launching a browser, so it catches the same breakage in seconds.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const e2eDir = join(root, 'e2e');

// Every Playwright config in the repo, so a spec parked in a niche config still counts
// as reachable and a broken import anywhere is caught.
const CONFIGS = readdirSync(root)
  .filter((file) => /^playwright(\..+)?\.config\.ts$/.test(file))
  .sort();

function listSpecs(config) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', `--config=${config}`, '--list', '--reporter=list'],
    { cwd: root, encoding: 'utf8', shell: true },
  );
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

const errors = [];
const seenFiles = new Set();

for (const config of CONFIGS) {
  const { ok, output } = listSpecs(config);
  if (!ok) {
    const reasons = output
      .split('\n')
      .filter((line) => /error|SyntaxError|Cannot find|does not provide/i.test(line))
      .slice(0, 15)
      .map((line) => line.trim());
    errors.push(`${config} failed to enumerate specs:\n    ${reasons.join('\n    ') || output.slice(0, 800)}`);
    continue;
  }
  for (const match of output.matchAll(/([\w.-]+\.spec\.ts):\d+:\d+/g)) {
    seenFiles.add(match[1]);
  }
  const total = output.match(/Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/);
  console.log(`  ✓ ${config} — ${total ? `${total[1]} tests in ${total[2]} files` : 'enumerated'}`);
}

// Every spec file on disk must be reachable from at least one config, otherwise it
// is dead coverage that nobody runs.
const onDisk = readdirSync(e2eDir).filter((file) => file.endsWith('.spec.ts'));
const orphans = onDisk.filter((file) => !seenFiles.has(file));

console.log('\nE2E spec integrity');
console.log('────────────────────────────────────────');
console.log(`Spec files on disk: ${onDisk.length}`);
console.log(`Spec files reachable from a config: ${seenFiles.size}`);

if (orphans.length > 0) {
  errors.push(
    `Spec files not matched by any Playwright config (dead coverage): ${orphans.join(', ')}`,
  );
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  for (const error of errors) {
    console.error(`  ✗ ${error}`);
  }
  process.exit(1);
}

console.log('✓ All e2e specs import cleanly and are reachable from a config');
