#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const previousCandidate = 'c93a595028a014b06e4a1df0275042187c519ac7';
const currentCandidate = '1e67483b46117d01756e9262a9c0977e71383a94';
const sourcePath = new URL('./sandbox-production-certification.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-certification-r4.mjs';

const source = await readFile(sourcePath, 'utf8');
const updated = source.replace(previousCandidate, currentCandidate);
if (updated === source) {
  throw new Error('Unable to bind the final certification runner to the round-four candidate SHA.');
}
await writeFile(generatedPath, updated, 'utf8');
await import(pathToFileURL(generatedPath).href);
