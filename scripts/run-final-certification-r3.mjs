#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const previousCandidate = 'c93a595028a014b06e4a1df0275042187c519ac7';
const currentCandidate = '4b5544a3b239d7036dddc3c67e94bd6ef14637db';
const sourcePath = new URL('./sandbox-production-certification.mjs', import.meta.url);
const generatedPath = '/tmp/vish-final-certification-r3.mjs';

const source = await readFile(sourcePath, 'utf8');
const updated = source.replace(previousCandidate, currentCandidate);
if (updated === source) {
  throw new Error('Unable to bind the final certification runner to the round-three candidate SHA.');
}
await writeFile(generatedPath, updated, 'utf8');
await import(pathToFileURL(generatedPath).href);
