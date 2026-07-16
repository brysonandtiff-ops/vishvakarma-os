#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const previousCandidate = 'c93a595028a014b06e4a1df0275042187c519ac7';
const currentCandidate = 'f65adecfbc429fffaa21221525b4e7f1a901d634';
const sourcePath = new URL('./sandbox-production-certification.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-certification-r5.mjs';

const source = await readFile(sourcePath, 'utf8');
const updated = source.replace(previousCandidate, currentCandidate);
if (updated === source) {
  throw new Error('Unable to bind the final certification runner to the round-five candidate SHA.');
}
await writeFile(generatedPath, updated, 'utf8');
await import(pathToFileURL(generatedPath).href);
