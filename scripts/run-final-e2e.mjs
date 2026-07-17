#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-accelerated-snapshot-cert.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-e2e.mjs';
let source = await readFile(sourcePath, 'utf8');
source = source.replace(
  "const candidateSha = '8a0a649e424500f8ebbb6d03b07d4b5ee939c8e8';",
  "const candidateSha = 'e57d5c867d288ee345e5aa8e8fca6a7fd3987402';",
);
source = source.replace(
  "const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();",
  "const phase = 'e2e';",
);
source = source.replace(
  'const PHASES = {',
  "const PHASES = {\n  e2e: { commands: ['PLAYWRIGHT_BROWSERS=all node scripts/run-e2e-gates.mjs'] },",
);
if (!source.includes("const candidateSha = 'e57d5c867d288ee345e5aa8e8fca6a7fd3987402';")) {
  throw new Error('Unable to bind final candidate SHA');
}
if (!source.includes("const phase = 'e2e';")) {
  throw new Error('Unable to bind e2e phase');
}
await writeFile(generatedPath, source, 'utf8');
await import(pathToFileURL(generatedPath).href);
