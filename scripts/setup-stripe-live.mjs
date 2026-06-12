#!/usr/bin/env node
/**
 * Live Stripe operator setup: products/prices, webhook endpoint, legacy price archival.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe-live.mjs
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe-live.mjs --push-vercel
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { loadEnvFile } from './load-env-file.mjs';

const ENV_PATH = join(process.cwd(), '.env.stripe.local');
loadEnvFile(ENV_PATH);

const APP_URL = (process.env.APP_URL ?? 'https://vishvakarma-os.vercel.app').replace(/\/$/, '');
const WEBHOOK_PATH = '/api/stripe/webhook';
const WEBHOOK_URL = `${APP_URL}${WEBHOOK_PATH}`;
const pushVercel = process.argv.includes('--push-vercel');

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
];

const STUDIO_AMOUNT = 49900;
const ENTERPRISE_AMOUNT = 100000;
const LEGACY_AMOUNTS = new Set([9900, 24900]);

function extractCliKey(live) {
  const result = spawnSync(process.execPath, ['scripts/extract-stripe-cli-key.mjs', live ? '--live' : '--test'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  const key = result.stdout?.trim();
  return key && !key.includes('*') ? key : null;
}

function resolveStripeKey() {
  const fromEnv = process.env.STRIPE_SECRET_KEY?.trim();
  if (fromEnv && !fromEnv.includes('*')) return fromEnv;

  const liveKey = extractCliKey(true);
  if (liveKey) {
    console.log('[OK] Using live Stripe key from CLI config');
    return liveKey;
  }

  const testKey = extractCliKey(false);
  if (testKey) {
    console.warn('[WARN] Live key unavailable in CLI config — using sk_test_ from CLI (re-login for live)');
    return testKey;
  }

  console.error('[FAIL] STRIPE_SECRET_KEY not set and Stripe CLI keys unavailable.');
  console.error('       Run: node scripts/stripe-cli-login.mjs  OR  node scripts/fetch-stripe-live-key.mjs');
  process.exit(1);
}

function upsertEnvFile(entries) {
  const lines = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8').split('\n') : [];
  const map = new Map();
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  for (const [key, value] of Object.entries(entries)) {
    if (value) map.set(key, value);
  }
  writeFileSync(ENV_PATH, `${[...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n')}\n`, 'utf8');
  console.log(`[OK] Updated ${ENV_PATH}`);
}

function requireStripeKey() {
  const key = resolveStripeKey();
  if (!key.startsWith('sk_live_') && !key.startsWith('rk_live_')) {
    console.warn('[WARN] STRIPE_SECRET_KEY is not a live key — use sk_live_/rk_live_ for production rollout');
  }
  return key;
}

async function stripeRequest(secretKey, method, path, body) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe API ${response.status}`);
  }
  return payload;
}

async function paginate(secretKey, path, params = {}) {
  const items = [];
  let startingAfter;
  for (;;) {
    const query = new URLSearchParams({ limit: '100', ...params });
    if (startingAfter) query.set('starting_after', startingAfter);
    const page = await stripeRequest(secretKey, 'GET', `${path}?${query.toString()}`);
    items.push(...(page.data ?? []));
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return items;
}

async function ensurePlanPrices(secretKey) {
  const setup = spawnSync(process.execPath, ['scripts/setup-stripe-products.mjs'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
  });
  process.stdout.write(setup.stdout ?? '');
  process.stderr.write(setup.stderr ?? '');
  if (setup.status !== 0) {
    throw new Error('setup-stripe-products.mjs failed');
  }

  const studioPriceId = process.env.STRIPE_PRICE_STUDIO_MONTHLY?.trim();
  const enterprisePriceId = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim();

  const studioMatch = (setup.stdout ?? '').match(/STRIPE_PRICE_STUDIO_MONTHLY=(price_[^\s]+)/);
  const enterpriseMatch = (setup.stdout ?? '').match(/STRIPE_PRICE_ENTERPRISE_MONTHLY=(price_[^\s]+)/);

  return {
    studioPriceId: studioMatch?.[1] ?? studioPriceId,
    enterprisePriceId: enterpriseMatch?.[1] ?? enterprisePriceId,
  };
}

async function ensureWebhook(secretKey) {
  const endpoints = await paginate(secretKey, '/webhook_endpoints');
  const existing = endpoints.find((endpoint) => endpoint.url === WEBHOOK_URL && endpoint.status !== 'disabled');

  if (existing) {
    console.log(`[OK] Found webhook endpoint ${existing.id} → ${WEBHOOK_URL}`);
    return existing.secret;
  }

  const body = {
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
  };
  const params = {
    url: WEBHOOK_URL,
  };
  for (const [index, event] of WEBHOOK_EVENTS.entries()) {
    params[`enabled_events[${index}]`] = event;
  }

  const created = await stripeRequest(secretKey, 'POST', '/webhook_endpoints', params);
  console.log(`[OK] Created webhook endpoint ${created.id} → ${WEBHOOK_URL}`);
  if (!created.secret) {
    throw new Error('Webhook created but signing secret missing — retrieve from Stripe Dashboard');
  }
  return created.secret;
}

async function archiveLegacyPrices(secretKey, keepPriceIds) {
  const prices = await paginate(secretKey, '/prices', { active: 'true' });
  const keep = new Set(keepPriceIds.filter(Boolean));
  let archived = 0;

  for (const price of prices) {
    if (keep.has(price.id)) continue;
    if (!price.recurring || price.recurring.interval !== 'month') continue;
    if (!LEGACY_AMOUNTS.has(price.unit_amount ?? -1)) continue;

    await stripeRequest(secretKey, 'POST', `/prices/${price.id}`, { active: 'false' });
    console.log(`[OK] Archived legacy price ${price.id} ($${(price.unit_amount / 100).toFixed(0)}/mo)`);
    archived += 1;
  }

  if (archived === 0) {
    console.log('[OK] No active legacy $99/$249 monthly prices found');
  }
}

async function checkAccount(secretKey) {
  const account = await stripeRequest(secretKey, 'GET', '/account');
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const detailsSubmitted = account.details_submitted === true;

  console.log(`[INFO] Stripe account ${account.id ?? account.email ?? 'unknown'}`);
  console.log(`[INFO] charges_enabled=${chargesEnabled} payouts_enabled=${payoutsEnabled} details_submitted=${detailsSubmitted}`);

  if (!chargesEnabled || !detailsSubmitted) {
    console.warn('[WARN] Stripe live account may not be fully activated — complete Dashboard setup before taking payments');
  }

  try {
    const portal = await stripeRequest(secretKey, 'GET', '/billing_portal/configurations?limit=1');
    const active = (portal.data ?? []).some((config) => config.active);
    if (active) {
      console.log('[OK] Customer portal configuration is active');
    } else {
      console.warn('[WARN] Enable Customer Portal: Stripe Dashboard → Settings → Billing → Customer portal');
    }
  } catch {
    console.warn('[WARN] Could not verify Customer Portal configuration');
  }
}

function pushEnvToVercel(entries) {
  for (const [name, value] of Object.entries(entries)) {
    if (!value) continue;
    console.log(`[INFO] vercel env add ${name} production`);
    const result = spawnSync('vercel', ['env', 'add', name, 'production', '--force'], {
      input: value,
      encoding: 'utf8',
      shell: true,
    });
    if (result.status !== 0) {
      console.warn(`[WARN] vercel env add ${name} failed — set manually in Vercel Dashboard`);
      console.warn(result.stderr ?? result.stdout ?? '');
    } else {
      console.log(`[OK] Set ${name} on Vercel production`);
    }
  }
}

async function loadOptionalFirebaseEnv() {
  const envPath = join(process.cwd(), '.env.stripe.local');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    out[match[1]] = match[2];
  }
  return out;
}

async function main() {
  const secretKey = requireStripeKey();
  await checkAccount(secretKey);

  const { studioPriceId, enterprisePriceId } = await ensurePlanPrices(secretKey);
  if (!studioPriceId || !enterprisePriceId) {
    throw new Error('Missing STRIPE_PRICE_STUDIO_MONTHLY / STRIPE_PRICE_ENTERPRISE_MONTHLY from setup output');
  }

  const webhookSecret = await ensureWebhook(secretKey);
  await archiveLegacyPrices(secretKey, [studioPriceId, enterprisePriceId]);

  const firebaseEnv = await loadOptionalFirebaseEnv();

  upsertEnvFile({
    STRIPE_SECRET_KEY: secretKey,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    STRIPE_PRICE_STUDIO_MONTHLY: studioPriceId,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: enterprisePriceId,
    FIREBASE_PROJECT_ID: firebaseEnv.FIREBASE_PROJECT_ID ?? 'gen-lang-client-0690161780',
    FIREBASE_SERVICE_ACCOUNT_JSON: firebaseEnv.FIREBASE_SERVICE_ACCOUNT_JSON,
    APP_URL,
    VITE_STRIPE_BILLING_ENABLED: 'true',
    VITE_PRICING_PAGE_ENABLED: 'true',
    VITE_BACKEND_PROVIDER: 'firebase',
    BACKEND_PROVIDER: 'firebase',
  });

  console.log('');
  console.log('=== Vercel Production env (server + client) ===');
  console.log(`STRIPE_PRICE_STUDIO_MONTHLY=${studioPriceId}`);
  console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${enterprisePriceId}`);
  console.log('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET saved to .env.stripe.local');
  console.log('');
  console.log('Redeploy production after pushing env vars.');

  if (pushVercel) {
    pushEnvToVercel({
      STRIPE_SECRET_KEY: secretKey,
      STRIPE_WEBHOOK_SECRET: webhookSecret,
      STRIPE_PRICE_STUDIO_MONTHLY: studioPriceId,
      STRIPE_PRICE_ENTERPRISE_MONTHLY: enterprisePriceId,
      FIREBASE_PROJECT_ID: firebaseEnv.FIREBASE_PROJECT_ID ?? 'gen-lang-client-0690161780',
      FIREBASE_SERVICE_ACCOUNT_JSON: firebaseEnv.FIREBASE_SERVICE_ACCOUNT_JSON,
      APP_URL,
      VITE_STRIPE_BILLING_ENABLED: 'true',
      VITE_PRICING_PAGE_ENABLED: 'true',
      VITE_BACKEND_PROVIDER: 'firebase',
      BACKEND_PROVIDER: 'firebase',
    });
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
