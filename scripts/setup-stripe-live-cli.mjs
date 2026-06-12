#!/usr/bin/env node
/**
 * Creates LIVE mode Vishvakarma products/prices/webhook using Stripe CLI auth.
 * Usage: node scripts/setup-stripe-live-cli.mjs [--write-env] [--push-vercel]
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { loadEnvFile } from './load-env-file.mjs';

const ENV_PATH = join(process.cwd(), '.env.stripe.local');
const APP_URL = (process.env.APP_URL ?? 'https://vishvakarma-os.vercel.app').replace(/\/$/, '');
const WEBHOOK_URL = `${APP_URL}/api/stripe/webhook`;
const writeEnv = process.argv.includes('--write-env') || true;
const pushVercel = process.argv.includes('--push-vercel');

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
];

const PLANS = [
  { plan: 'studio', name: 'Vishvakarma Studio', amount: 49900, envKey: 'STRIPE_PRICE_STUDIO_MONTHLY' },
  { plan: 'enterprise', name: 'Vishvakarma Enterprise', amount: 100000, envKey: 'STRIPE_PRICE_ENTERPRISE_MONTHLY' },
];

function stripeCli(method, path, params = {}, live = true) {
  const parts = ['npx', '-y', '@stripe/cli', method, path, '-c'];
  if (live) parts.push('--live');
  for (const [key, value] of Object.entries(params)) {
    parts.push('-d', `"${String(key).replace(/"/g, '\\"')}=${String(value).replace(/"/g, '\\"')}"`);
  }
  const result = spawnSync(parts.join(' '), { encoding: 'utf8', shell: true });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || `stripe ${method} ${path} failed`);
  }
  return JSON.parse(result.stdout);
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

function stripeCliGet(path, params = {}, live = true) {
  return stripeCli('get', path, params, live);
}

function stripeCliPost(path, params = {}, live = true) {
  return stripeCli('post', path, params, live);
}

function upsertEnv(entries) {
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
}

function findProductByPlan(products, plan) {
  return (products.data ?? []).find((p) => p.metadata?.vishvakarma_plan === plan);
}

function findMonthlyPrice(prices, productId, plan, amount) {
  return (prices.data ?? []).find(
    (price) =>
      price.product === productId &&
      price.recurring?.interval === 'month' &&
      price.unit_amount === amount &&
      price.metadata?.vishvakarma_plan === plan
  );
}

async function ensureLivePlan(secretKey, { plan, name, amount, envKey }) {
  const products = await stripeRequest(secretKey, 'GET', '/products?limit=100&active=true');
  let product = findProductByPlan(products, plan);
  if (!product) {
    product = await stripeRequest(secretKey, 'POST', '/products', {
      name,
      'metadata[vishvakarma_plan]': plan,
    });
    console.log(`[OK] Created LIVE product ${product.id} (${plan})`);
  } else {
    console.log(`[OK] Found LIVE product ${product.id} (${plan})`);
  }

  const prices = await stripeRequest(secretKey, 'GET', `/prices?product=${product.id}&limit=100&active=true`);
  let price = findMonthlyPrice(prices, product.id, plan, amount);
  if (!price) {
    price = await stripeRequest(secretKey, 'POST', '/prices', {
      product: product.id,
      currency: 'usd',
      'recurring[interval]': 'month',
      unit_amount: String(amount),
      'metadata[vishvakarma_plan]': plan,
    });
    console.log(`[OK] Created LIVE price ${price.id} (${plan})`);
  } else {
    console.log(`[OK] Found LIVE price ${price.id} (${plan})`);
  }

  console.log(`${envKey}=${price.id}`);
  return price.id;
}

async function ensureLiveWebhook(secretKey) {
  const endpoints = await stripeRequest(secretKey, 'GET', '/webhook_endpoints?limit=100');
  const existing = (endpoints.data ?? []).find((e) => e.url === WEBHOOK_URL && e.status !== 'disabled');
  if (existing) {
    console.log(`[OK] Found LIVE webhook ${existing.id} → ${WEBHOOK_URL}`);
    return existing.secret;
  }

  const params = { url: WEBHOOK_URL };
  WEBHOOK_EVENTS.forEach((event, index) => {
    params[`enabled_events[${index}]`] = event;
  });
  const created = await stripeRequest(secretKey, 'POST', '/webhook_endpoints', params);
  console.log(`[OK] Created LIVE webhook ${created.id} → ${WEBHOOK_URL}`);
  if (!created.secret) throw new Error('LIVE webhook missing signing secret');
  return created.secret;
}

async function archiveLegacyLivePrices(secretKey, keepIds) {
  const keep = new Set(keepIds);
  const prices = await stripeRequest(secretKey, 'GET', '/prices?limit=100&active=true');
  let archived = 0;
  for (const price of prices.data ?? []) {
    if (keep.has(price.id)) continue;
    if (!price.recurring || price.recurring.interval !== 'month') continue;
    if (price.unit_amount !== 9900 && price.unit_amount !== 24900) continue;
    await stripeRequest(secretKey, 'POST', `/prices/${price.id}`, { active: 'false' });
    console.log(`[OK] Archived LIVE legacy price ${price.id}`);
    archived += 1;
  }
  if (archived === 0) console.log('[OK] No active LIVE legacy $99/$249 prices found');
}

function resolveLiveSecretKey() {
  const liveOverride = process.env.STRIPE_LIVE_SECRET_KEY?.trim();
  if (liveOverride?.startsWith('sk_live_')) return liveOverride;

  loadEnvFile(ENV_PATH);
  const fromEnv = process.env.STRIPE_SECRET_KEY?.trim();
  if (fromEnv?.startsWith('sk_live_')) return fromEnv;

  const extract = spawnSync(process.execPath, ['scripts/extract-stripe-cli-key.mjs', '--live'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (extract.status === 0) {
    const key = extract.stdout.trim();
    if (key.startsWith('sk_live_') && !key.includes('*')) return key;
  }

  console.error('[FAIL] LIVE setup requires sk_live_... in .env.stripe.local');
  console.error('       Stripe CLI only stores a read-only rk_live_ key for live mode.');
  console.error('       Copy your secret key from: https://dashboard.stripe.com/apikeys');
  console.error('       Or run: pnpm run import:stripe-live-key (paste dialog)');
  console.error('       Or run: node scripts/fetch-stripe-live-key.mjs');
  console.error('       Or set STRIPE_LIVE_SECRET_KEY=sk_live_... for this command only');
  process.exit(1);
}

async function main() {
  const liveSecret = resolveLiveSecretKey();
  console.log('[INFO] Setting up LIVE Stripe resources...');

  const account = await stripeRequest(liveSecret, 'GET', '/account');
  console.log(`[INFO] LIVE account ${account.id} charges_enabled=${account.charges_enabled}`);

  const studioPriceId = await ensureLivePlan(liveSecret, PLANS[0]);
  const enterprisePriceId = await ensureLivePlan(liveSecret, PLANS[1]);
  const webhookSecret = await ensureLiveWebhook(liveSecret);
  await archiveLegacyLivePrices(liveSecret, [studioPriceId, enterprisePriceId]);
  const firebaseEnv = existsSync(ENV_PATH) ? Object.fromEntries(
    readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  ) : {};

  const envUpdates = {
    STRIPE_PRICE_STUDIO_MONTHLY: studioPriceId,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: enterprisePriceId,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    FIREBASE_PROJECT_ID: firebaseEnv.FIREBASE_PROJECT_ID ?? 'gen-lang-client-0690161780',
    FIREBASE_SERVICE_ACCOUNT_JSON: firebaseEnv.FIREBASE_SERVICE_ACCOUNT_JSON,
    APP_URL,
    VITE_STRIPE_BILLING_ENABLED: 'true',
    VITE_PRICING_PAGE_ENABLED: 'true',
    VITE_BACKEND_PROVIDER: 'firebase',
    BACKEND_PROVIDER: 'firebase',
  };
  if (liveSecret) envUpdates.STRIPE_SECRET_KEY = liveSecret;

  upsertEnv(envUpdates);
  console.log(`[OK] Updated ${ENV_PATH}`);

  if (pushVercel) {
    const push = spawnSync(process.execPath, ['scripts/push-stripe-env-vercel.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (push.status !== 0) process.exit(push.status ?? 1);
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
