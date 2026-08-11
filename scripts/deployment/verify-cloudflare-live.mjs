const base = (process.argv[2] || process.env.CLOUDFLARE_BASE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/deployment/verify-cloudflare-live.mjs https://<deployment>.pages.dev');
  process.exit(2);
}

const failures = [];

async function check(path, verify) {
  try {
    const response = await fetch(`${base}${path}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'vishvakarma-cloudflare-certifier/1.0' },
    });
    const body = await response.text();
    await verify(response, body);
    console.log(`PASS ${path} ${response.status}`);
  } catch (error) {
    failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL ${path}`);
  }
}

await check('/', (response, body) => {
  if (!response.ok) throw new Error(`landing returned ${response.status}`);
  if (!/vishvakarma/i.test(body)) throw new Error('landing page identity missing');
  if (response.headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error('missing X-Content-Type-Options');
  }
});

await check('/editor', (response, body) => {
  if (!response.ok) throw new Error(`deep route returned ${response.status}`);
  if (!/<html/i.test(body)) throw new Error('deep route did not return SPA HTML');
});

await check('/api/health', (response, body) => {
  if (response.status !== 200) throw new Error(`health returned ${response.status}: ${body.slice(0, 200)}`);
  const json = JSON.parse(body);
  if (json.ok !== true || json.service !== 'vishvakarma-os') {
    throw new Error('health payload is not production-ready');
  }
  if (!/no-store/i.test(response.headers.get('cache-control') || '')) {
    throw new Error('health response must not be cached');
  }
});

await check('/api/__cloudflare_cert_missing__', (response) => {
  if (response.status !== 404) throw new Error(`unknown API returned ${response.status}, expected 404`);
  if (!/no-store/i.test(response.headers.get('cache-control') || '')) {
    throw new Error('unknown API response must not be cached');
  }
});

await check('/sw.js', (response) => {
  if (!response.ok) throw new Error(`service worker returned ${response.status}`);
  if (!/must-revalidate/i.test(response.headers.get('cache-control') || '')) {
    throw new Error('service worker cache policy is not release-safe');
  }
});

if (failures.length) {
  console.error('\nCloudflare LIVE certification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`\nCloudflare LIVE certification PASSED: ${base}`);
