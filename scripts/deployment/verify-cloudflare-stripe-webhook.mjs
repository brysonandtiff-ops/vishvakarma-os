#!/usr/bin/env node

import { createHmac } from 'node:crypto';
import { join } from 'node:path';
import { loadEnvFile } from '../load-env-file.mjs';

loadEnvFile(join(process.cwd(), '.env.stripe.local'));
loadEnvFile(join(process.cwd(), '.env.local'));

const baseUrl = new URL(
  process.env.CLOUDFLARE_PAGES_URL || 'https://vishvakarma-os.pages.dev',
);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

if (!webhookSecret) {
  console.error('[FAIL] STRIPE_WEBHOOK_SECRET is required.');
  process.exit(1);
}

if (!webhookSecret.startsWith('whsec_')) {
  console.error('[FAIL] STRIPE_WEBHOOK_SECRET must be a Stripe signing secret (whsec_...).');
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);
const event = {
  id: `evt_vish_cloudflare_probe_${timestamp}`,
  object: 'event',
  api_version: '2025-02-24.acacia',
  created: timestamp,
  data: { object: {} },
  livemode: webhookSecret.includes('_live_'),
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: 'vishvakarma.cloud_delivery_probe',
};
const payload = JSON.stringify(event);
const signature = createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

const endpoint = new URL('/api/stripe/webhook', baseUrl);
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'stripe-signature': `t=${timestamp},v1=${signature}`,
  },
  body: payload,
  signal: AbortSignal.timeout(30_000),
});

let body;
try {
  body = await response.json();
} catch {
  body = { raw: await response.text() };
}

if (response.status !== 200 || body?.received !== true) {
  console.error(
    `[FAIL] Signed Cloudflare webhook probe returned HTTP ${response.status}: ${JSON.stringify(body)}`,
  );
  process.exit(1);
}

console.log(`[PASS] Signed Stripe webhook accepted by ${endpoint.origin}`);
