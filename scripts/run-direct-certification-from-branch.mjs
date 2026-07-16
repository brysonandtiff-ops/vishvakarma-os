#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const phase = (await readFile(new URL('../cert-phase.txt', import.meta.url), 'utf8')).trim();
if (!phase) throw new Error('cert-phase.txt is empty');

process.env.CERT_PHASE = phase;
console.log(`[direct-cert] loaded phase ${phase} from cert-phase.txt`);
await import('./run-direct-certification-phase.mjs');
