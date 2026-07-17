#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./run-accelerated-snapshot-cert.mjs', import.meta.url);
const generatedPath = '/tmp/vish-exact-perfauth.mjs';
const source = await readFile(sourcePath, 'utf8');
const updated = source.replace(
  "const candidateSha = '8a0a649e424500f8ebbb6d03b07d4b5ee939c8e8';",
  "const candidateSha = '35088c7afc58224ced9c26efe8429367063c3222';",
);
if (updated === source) throw new Error('Unable to bind exact perfauth candidate SHA');
await writeFile(generatedPath, updated, 'utf8');
await import(pathToFileURL(generatedPath).href);
