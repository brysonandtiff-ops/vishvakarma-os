import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];

function read(path) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    failures.push(`missing ${path}`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

function requireTruth(condition, message) {
  if (!condition) failures.push(message);
}

const wranglerText = read('wrangler.jsonc');
let wrangler = {};
try {
  wrangler = JSON.parse(wranglerText);
} catch {
  failures.push('wrangler.jsonc must be valid JSONC-without-comments for deterministic CI parsing');
}

requireTruth(wrangler.name === 'vishvakarma-os', 'Wrangler project name must be vishvakarma-os');
requireTruth(wrangler.pages_build_output_dir === './dist', 'Pages output must be ./dist');
requireTruth(Array.isArray(wrangler.compatibility_flags) && wrangler.compatibility_flags.includes('nodejs_compat'), 'nodejs_compat must be enabled');

const routesText = read('public/_routes.json');
try {
  const routes = JSON.parse(routesText);
  requireTruth(routes.version === 1, '_routes.json version must be 1');
  requireTruth(routes.include?.includes('/api/*'), '_routes.json must include /api/*');
} catch {
  failures.push('public/_routes.json must be valid JSON');
}

const headers = read('public/_headers');
for (const required of [
  'Strict-Transport-Security:',
  'X-Content-Type-Options: nosniff',
  'X-Frame-Options: DENY',
  'Content-Security-Policy:',
  '/sw.js',
]) {
  requireTruth(headers.includes(required), `public/_headers missing ${required}`);
}

const router = read('functions/api/[[path]].ts');
for (const endpoint of [
  "'ai/extract-requirements'",
  "'ai/parse-site-documents'",
  "'cast/evidence'",
  "'cast/join'",
  "'cast/sessions'",
  'health:',
  "'stripe/create-checkout-session'",
  "'stripe/create-portal-session'",
  "'stripe/webhook'",
]) {
  requireTruth(router.includes(endpoint), `Pages API router missing ${endpoint}`);
}

const adapter = read('cloudflare/nodeHandlerAdapter.ts');
requireTruth(adapter.includes('request.arrayBuffer()'), 'API adapter must preserve raw request bytes');
requireTruth(adapter.includes("statusCode = 500"), 'API adapter must fail closed on unhandled errors');

const health = read('api/health.ts');
requireTruth(!health.includes("node:fs"), 'Cloudflare health endpoint must not depend on node:fs');

const origin = read('api/_lib/appOrigin.ts');
requireTruth(origin.includes('CLOUDFLARE_PAGES_ORIGIN'), 'Origin policy must include Cloudflare Pages');
requireTruth(origin.includes('CF_PAGES_URL'), 'Origin policy must accept the platform preview URL explicitly');

if (failures.length) {
  console.error('Cloudflare configuration certification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Cloudflare configuration certification PASSED');
