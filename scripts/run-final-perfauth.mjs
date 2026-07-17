#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-accelerated-snapshot-cert.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-perfauth.mjs';
let source = await readFile(sourcePath, 'utf8');
source = source.replace(
  "const candidateSha = '8a0a649e424500f8ebbb6d03b07d4b5ee939c8e8';",
  "const candidateSha = '6bfc2ccfc4623d66c22d9f2abecf49f597cc542a';",
);
source = source.replace(
  "const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();",
  "const phase = 'perfauth';",
);
if (!source.includes("const candidateSha = '6bfc2ccfc4623d66c22d9f2abecf49f597cc542a';")) {
  throw new Error('Unable to bind final candidate SHA');
}
if (!source.includes("const phase = 'perfauth';")) {
  throw new Error('Unable to bind perfauth phase');
}
await writeFile(generatedPath, source, 'utf8');
await import(pathToFileURL(generatedPath).href);
