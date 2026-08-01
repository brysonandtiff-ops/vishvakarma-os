#!/usr/bin/env node

const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PRODUCTION_URL ||
    'https://vishvakarma-os.pages.dev',
);
const proofToken = process.env.CLOUDFLARE_PROOF_TOKEN?.trim();

if (!proofToken) {
  console.error('[FAIL] CLOUDFLARE_PROOF_TOKEN is required.');
  process.exitCode = 1;
} else {
  try {
    const response = await fetch(
      new URL('/api/stripe/proof-webhook', baseUrl),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vish-proof-token': proofToken,
        },
        body: '{}',
        signal: AbortSignal.timeout(30_000),
      },
    );
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    if (
      response.status !== 200 ||
      payload?.ok !== true ||
      payload?.received !== true
    ) {
      throw new Error(
        `HTTP ${response.status}: ${text.slice(0, 500) || '<empty response>'}`,
      );
    }

    console.log(
      '[PASS] Cloudflare verified the configured Stripe webhook secret entirely server-side.',
    );
  } catch (error) {
    console.error(
      '[FAIL] Server-side signed Stripe webhook proof failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
