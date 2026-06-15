#!/usr/bin/env node

import { parseArgs, exitWithFailures, pass, fail, info } from '../lib/cli.mjs';
import { probeMany } from '../lib/probe-http.mjs';
import { CANONICAL_ORIGIN } from '../lib/canonical-origin.mjs';

function resolveTargets(options) {
  const prod = options.prod === true || options.prod === 'true';
  const baseUrl = (options.url ?? (prod ? CANONICAL_ORIGIN : 'http://127.0.0.1:4173')).replace(/\/$/, '');
  const collabPort = process.env.COLLAB_WS_PORT ?? '1234';
  const collabUrl = `http://127.0.0.1:${collabPort}`;

  const targets = [
    { name: 'spa-auth', url: `${baseUrl}/auth`, expectStatus: 200, accept: 'text/html,*/*' },
  ];

  if (prod) {
    targets.unshift({ name: 'api-health', url: `${baseUrl}/api/health`, expectStatus: 200 });
  } else {
    targets.push({ name: 'collab-ws', url: collabUrl, expectStatus: 200, accept: 'text/plain,*/*' });
  }

  return { baseUrl, targets, prod };
}

async function main() {
  const { options } = parseArgs();
  const failures = [];
  const { baseUrl, targets, prod } = resolveTargets(options);

  info(`Health probe (${prod ? 'production' : 'local'}) → ${baseUrl}`);
  const results = await probeMany(targets, { timeoutMs: 15_000 });

  for (const result of results) {
    const expected = targets.find((target) => target.name === result.name)?.expectStatus ?? 200;
    const ok = result.status === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${result.name}: ${result.status} (${result.latencyMs}ms) ${result.url}`);
    if (!ok) {
      failures.push(`${result.name} returned ${result.status} for ${result.url}${result.error ? ` (${result.error})` : ''}`);
    }
    if (result.name === 'api-health' && result.json && typeof result.json === 'object') {
      console.log(`  version=${result.json.version} checks=${JSON.stringify(result.json.checks)}`);
    }
  }

  if (failures.length > 0) {
    fail('health-probe', `${failures.length} failure(s)`);
    exitWithFailures(failures);
  }

  pass('health-probe', `${targets.length} target(s) on ${baseUrl}`);
}

main().catch((error) => {
  fail('health-probe', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
