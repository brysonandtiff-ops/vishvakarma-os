#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-accelerated-snapshot-cert.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-release.mjs';
let source = await readFile(sourcePath, 'utf8');
source = source.replace(
  "const candidateSha = '8a0a649e424500f8ebbb6d03b07d4b5ee939c8e8';",
  "const candidateSha = '0e5a82578675bc2b18e1ce48242aee9016959771';",
);
source = source.replace(
  "const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();",
  "const phase = 'release';",
);
if (!source.includes("const candidateSha = '0e5a82578675bc2b18e1ce48242aee9016959771';")) {
  throw new Error('Unable to bind final release candidate SHA');
}
if (!source.includes("const phase = 'release';")) {
  throw new Error('Unable to bind release phase');
}
await writeFile(generatedPath, source, 'utf8');
await import(pathToFileURL(generatedPath).href);
