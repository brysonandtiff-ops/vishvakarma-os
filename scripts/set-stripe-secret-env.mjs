#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const envPath = '.env.stripe.local';
const key = process.argv[2]?.trim();
if (!key) {
  console.error('Usage: node scripts/set-stripe-secret-env.mjs <STRIPE_SECRET_KEY>');
  process.exit(1);
}

const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split('\n') : [];
const map = new Map();
for (const line of lines) {
  if (!line.trim()) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  map.set(line.slice(0, idx), line.slice(idx + 1));
}
map.set('STRIPE_SECRET_KEY', key);
writeFileSync(envPath, `${[...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n')}\n`, 'utf8');
console.log('[OK] STRIPE_SECRET_KEY saved to .env.stripe.local');
