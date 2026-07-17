#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-accelerated-snapshot-cert.mjs', import.meta.url);
const generatedPath = '/tmp/vish-exact-all-browser.mjs';
let source = await readFile(sourcePath, 'utf8');
source = source.replace(
  "const candidateSha = '8a0a649e424500f8ebbb6d03b07d4b5ee939c8e8';",
  "const candidateSha = '5822cb04d12238d30c3695d6f6e98579aa6977ba';",
);
source = source.replace(
  "const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();",
  "const phase = 'e2e';",
);
source = source.replace(
  'const PHASES = {',
  "const PHASES = {\n  e2e: 'PLAYWRIGHT_BROWSERS=all node scripts/run-e2e-gates.mjs',",
);
if (!source.includes("const candidateSha = '5822cb04d12238d30c3695d6f6e98579aa6977ba';")) {
  throw new Error('Unable to bind exact candidate SHA');
}
if (!source.includes("e2e: 'PLAYWRIGHT_BROWSERS=all node scripts/run-e2e-gates.mjs'")) {
  throw new Error('Unable to bind stable all-browser command');
}
await writeFile(generatedPath, source, 'utf8');
await import(pathToFileURL(generatedPath).href);
