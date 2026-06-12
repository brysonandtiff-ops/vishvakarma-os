#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

export function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

if (process.argv[1]?.includes('load-env-file.mjs')) {
  loadEnvFile(process.argv[2] ?? '.env.stripe.local');
}
