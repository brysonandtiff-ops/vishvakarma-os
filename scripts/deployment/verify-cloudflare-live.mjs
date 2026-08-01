#!/usr/bin/env node

const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL || 'https://vishvakarma-os.pages.dev',
);

const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
  console.log(`[PASS] ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`[FAIL] ${message}`);
}

async function request(path, init = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
    ...init,
  });
  return { url, response };
}

async function checkSpaRoute(path) {
  const { response } = await request(path, {
    headers: { Accept: 'text/html' },
  });
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    fail(`${path} returned HTTP ${response.status}`);
    return body;
  }
  if (!contentType.includes('text/html')) {
    fail(`${path} did not return HTML (${contentType || 'missing content-type'})`);
    return body;
  }
  if (!body.includes('id="root"') && !body.includes("id='root'")) {
    fail(`${path} did not contain the application root`);
    return body;
  }

  pass(`${path} serves the SPA`);
  return body;
}

async function checkHealth() {
  const { response } = await request('/api/health', {
    headers: { Accept: 'application/json' },
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    fail(`/api/health returned non-JSON HTTP ${response.status}`);
    return;
  }

  if (response.status !== 200 || payload?.ok !== true) {
    fail(`/api/health is not ready: HTTP ${response.status} ${JSON.stringify(payload)}`);
    return;
  }

  if (payload?.service !== 'vishvakarma-os') {
    fail(`/api/health returned unexpected service ${JSON.stringify(payload?.service)}`);
    return;
  }

  pass(`/api/health is ready (${payload.version || 'unknown version'})`);
}

async function checkUnknownApi() {
  const { response } = await request('/api/does-not-exist', {
    headers: { Accept: 'application/json' },
  });
  const contentType = response.headers.get('content-type') || '';

  if (response.status !== 404) {
    fail(`/api/does-not-exist returned HTTP ${response.status}, expected 404`);
    return;
  }
  if (!contentType.includes('application/json')) {
    fail(`/api/does-not-exist did not return secured JSON (${contentType})`);
    return;
  }

  const nosniff = response.headers.get('x-content-type-options');
  if (nosniff?.toLowerCase() !== 'nosniff') {
    fail(`/api/does-not-exist is missing X-Content-Type-Options: nosniff`);
    return;
  }

  pass('/api/does-not-exist returns a secured JSON 404');
}

async function checkServiceWorker() {
  const { response } = await request('/sw.js');
  if (!response.ok) {
    fail(`/sw.js returned HTTP ${response.status}`);
    return;
  }

  const allowed = response.headers.get('service-worker-allowed');
  if (allowed !== '/') {
    fail(`/sw.js has Service-Worker-Allowed ${JSON.stringify(allowed)}, expected "/"`);
    return;
  }

  const cacheControl = response.headers.get('cache-control') || '';
  if (cacheControl.toLowerCase().includes('immutable')) {
    fail('/sw.js must not use immutable caching');
    return;
  }

  pass('/sw.js has safe service-worker and cache headers');
}

async function checkHashedAsset(homeHtml) {
  const match = homeHtml.match(/(?:src|href)=["'](\/assets\/[^"']+)["']/i);
  if (!match) {
    fail('Could not find a hashed /assets/ resource in the home HTML');
    return;
  }

  const { response } = await request(match[1], { method: 'HEAD' });
  if (!response.ok) {
    fail(`${match[1]} returned HTTP ${response.status}`);
    return;
  }

  const cacheControl = response.headers.get('cache-control') || '';
  if (!cacheControl.toLowerCase().includes('immutable')) {
    fail(`${match[1]} is missing immutable caching (${cacheControl || 'no cache-control'})`);
    return;
  }

  pass(`${match[1]} uses immutable caching`);
}

async function main() {
  console.log(`[cloudflare-live] ${baseUrl.origin}`);

  const homeHtml = await checkSpaRoute('/');
  for (const path of ['/auth', '/pricing', '/profile', '/editor']) {
    await checkSpaRoute(path);
  }

  await checkHealth();
  await checkUnknownApi();
  await checkServiceWorker();
  await checkHashedAsset(homeHtml);

  console.log(`\n[cloudflare-live] ${passes.length} passed, ${failures.length} failed`);
  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error('[FAIL] Cloudflare live verification crashed');
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
