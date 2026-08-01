#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath =
  outputIndex >= 0 && args[outputIndex + 1]
    ? resolve(args[outputIndex + 1])
    : null;
const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL ||
    process.env.PRODUCTION_URL ||
    'https://vishvakarma-os.pages.dev',
);
const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!outputPath) {
  throw new Error('--output PATH is required.');
}
if (!secretKey || !/^(sk|rk)_(test|live)_/.test(secretKey)) {
  throw new Error('STRIPE_SECRET_KEY is missing or unsupported.');
}

async function stripeRequest(method, path, body, idempotencyKey) {
  const headers = {
    authorization: `Bearer ${secretKey}`,
  };
  let requestBody;

  if (body) {
    const form = new URLSearchParams();
    for (const [name, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      form.append(name, String(value));
    }
    headers['content-type'] = 'application/x-www-form-urlencoded';
    requestBody = form;
  }
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body: requestBody,
    signal: AbortSignal.timeout(45_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error?.message || `Stripe API ${method} ${path} returned ${response.status}.`,
    );
  }
  return payload;
}

async function getOrCreatePrice({ lookupKey, name, amount, currency }) {
  const encodedLookupKey = encodeURIComponent(lookupKey);
  const existing = await stripeRequest(
    'GET',
    `/prices?active=true&lookup_keys%5B%5D=${encodedLookupKey}&limit=1`,
  );
  const price = existing.data?.[0];
  if (price) {
    if (
      price.unit_amount !== amount ||
      price.currency !== currency ||
      price.recurring?.interval !== 'month'
    ) {
      throw new Error(
        `Existing Stripe lookup key ${lookupKey} does not match ${amount} ${currency}/month.`,
      );
    }
    return price.id;
  }

  const product = await stripeRequest(
    'POST',
    '/products',
    {
      name,
      description: 'Managed by the Vishvakarma.OS Cloudflare release controller',
      'metadata[managed_by]': 'vish-cloudflare-release-controller',
    },
    `vish-${lookupKey}-product-v2`,
  );
  const created = await stripeRequest(
    'POST',
    '/prices',
    {
      product: product.id,
      currency,
      unit_amount: amount,
      'recurring[interval]': 'month',
      lookup_key: lookupKey,
      'metadata[managed_by]': 'vish-cloudflare-release-controller',
    },
    `vish-${lookupKey}-price-v2`,
  );
  return created.id;
}

async function createDedicatedWebhook() {
  const endpointUrl = new URL('/api/stripe/webhook', baseUrl);
  endpointUrl.searchParams.set('source', 'vish-cloudflare-production-v2');

  const endpoints = await stripeRequest('GET', '/webhook_endpoints?limit=100');
  const existing = (endpoints.data || []).find(
    (endpoint) => endpoint.url === endpointUrl.toString(),
  );
  if (existing) {
    await stripeRequest('DELETE', `/webhook_endpoints/${existing.id}`);
  }

  const endpoint = await stripeRequest(
    'POST',
    '/webhook_endpoints',
    {
      url: endpointUrl.toString(),
      description: 'Vishvakarma.OS Cloudflare production billing webhook',
      'enabled_events[0]': 'checkout.session.completed',
      'enabled_events[1]': 'customer.subscription.updated',
      'enabled_events[2]': 'customer.subscription.deleted',
      'enabled_events[3]': 'invoice.payment_failed',
      'metadata[managed_by]': 'vish-cloudflare-release-controller',
    },
    `vish-cloudflare-production-webhook-v2`,
  );

  if (!endpoint.secret || !endpoint.secret.startsWith('whsec_')) {
    throw new Error('Stripe created the webhook but did not return its signing secret.');
  }
  return {
    id: endpoint.id,
    secret: endpoint.secret,
    url: endpoint.url,
  };
}

const account = await stripeRequest('GET', '/account');
const currency = String(account.default_currency || 'aud').toLowerCase();
const studioPrice = await getOrCreatePrice({
  lookupKey: 'vishvakarma_studio_monthly',
  name: 'Vishvakarma.OS Studio',
  amount: 49_900,
  currency,
});
const enterprisePrice = await getOrCreatePrice({
  lookupKey: 'vishvakarma_enterprise_monthly',
  name: 'Vishvakarma.OS Enterprise',
  amount: 100_000,
  currency,
});
const webhook = await createDedicatedWebhook();
const output = {
  STRIPE_SECRET_KEY: secretKey,
  STRIPE_WEBHOOK_SECRET: webhook.secret,
  STRIPE_PRICE_STUDIO_MONTHLY: studioPrice,
  STRIPE_PRICE_ENTERPRISE_MONTHLY: enterprisePrice,
  APP_URL: baseUrl.origin,
  metadata: {
    stripeMode: /_live_/.test(secretKey) ? 'live' : 'test',
    keyType: secretKey.startsWith('rk_') ? 'restricted' : 'secret',
    currency,
    webhookId: webhook.id,
    webhookUrl: webhook.url,
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, {
  encoding: 'utf8',
  mode: 0o600,
});
console.log(
  `[PASS] Stripe billing bootstrap completed in ${output.metadata.stripeMode} mode (${currency.toUpperCase()}).`,
);
console.log('[PASS] Secret values were written only to the requested temporary output file.');
