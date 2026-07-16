#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const previousCandidate = 'c93a595028a014b06e4a1df0275042187c519ac7';
const currentCandidate = '4b825fde0cd6abcb1305ce4e320d4e7296792358';
const sourcePath = new URL('./sandbox-production-certification.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-certification-r6.mjs';

const source = await readFile(sourcePath, 'utf8');
const updated = source.replace(previousCandidate, currentCandidate);
if (updated === source) {
  throw new Error('Unable to bind the final certification runner to the round-six candidate SHA.');
}
await writeFile(generatedPath, updated, 'utf8');
await import(pathToFileURL(generatedPath).href);
