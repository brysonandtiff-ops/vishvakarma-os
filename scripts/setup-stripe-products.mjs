#!/usr/bin/env node
/**
 * Idempotently create Vishvakarma Studio product + monthly price in Stripe.
 *
 * Safe local flow:
 *   1. cp .env.stripe.local.example .env.stripe.local
 *   2. Paste STRIPE_SECRET_KEY into .env.stripe.local (never commit it)
 *   3. pnpm run setup:stripe
 *
 * Inline flow still works by prefixing the command with STRIPE_SECRET_KEY.
 */
import { join } from 'node:path';
import { loadEnvFile } from './load-env-file.mjs';

loadEnvFile(join(process.cwd(), '.env.stripe.local'));
loadEnvFile(join(process.cwd(), '.env.local'));

const STUDIO_PLAN = 'studio';
const ENTERPRISE_PLAN = 'enterprise';
const PRODUCT_METADATA_KEY = 'vishvakarma_plan';
const STUDIO_PRODUCT_NAME = 'Vishvakarma Studio';
const ENTERPRISE_PRODUCT_NAME = 'Vishvakarma Enterprise';
const STUDIO_MONTHLY_AMOUNT_CENTS = 49900;
const ENTERPRISE_MONTHLY_AMOUNT_CENTS = 100000;

function requireStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.error('[FAIL] STRIPE_SECRET_KEY is required.');
    console.error('Add it to .env.stripe.local or prefix the setup command with STRIPE_SECRET_KEY.');
    process.exit(1);
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

async function findProductByPlan(secretKey, plan) {
  const products = await stripeRequest(secretKey, 'GET', '/products?limit=100&active=true');
  return (products.data ?? []).find((product) => product.metadata?.[PRODUCT_METADATA_KEY] === plan);
}

async function findMonthlyPrice(secretKey, productId, plan, amountCents) {
  const prices = await stripeRequest(secretKey, 'GET', `/prices?product=${productId}&limit=100&active=true`);
  return (prices.data ?? []).find(
    (price) =>
      price.recurring?.interval === 'month' &&
      price.unit_amount === amountCents &&
      price.metadata?.[PRODUCT_METADATA_KEY] === plan
  );
}

async function ensurePlan(secretKey, plan, productName, amountCents, envKey) {
  let product = await findProductByPlan(secretKey, plan);
  if (!product) {
    product = await stripeRequest(secretKey, 'POST', '/products', {
      name: productName,
      [`metadata[${PRODUCT_METADATA_KEY}]`]: plan,
    });
    console.log(`[OK] Created product ${product.id} (${plan})`);
  } else {
    console.log(`[OK] Found existing product ${product.id} (${plan})`);
  }

  let price = await findMonthlyPrice(secretKey, product.id, plan, amountCents);
  if (!price) {
    price = await stripeRequest(secretKey, 'POST', '/prices', {
      product: product.id,
      currency: 'usd',
      'recurring[interval]': 'month',
      unit_amount: String(amountCents),
      [`metadata[${PRODUCT_METADATA_KEY}]`]: plan,
    });
    console.log(`[OK] Created price ${price.id} (${plan})`);
  } else {
    console.log(`[OK] Found existing price ${price.id} (${plan})`);
  }

  console.log(`${envKey}=${price.id}`);
  return price.id;
}

async function main() {
  const secretKey = requireStripeKey();

  console.log('');
  console.log('Add these values to Vercel Production env and .env.stripe.local:');
  await ensurePlan(
    secretKey,
    STUDIO_PLAN,
    STUDIO_PRODUCT_NAME,
    STUDIO_MONTHLY_AMOUNT_CENTS,
    'STRIPE_PRICE_STUDIO_MONTHLY'
  );
  await ensurePlan(
    secretKey,
    ENTERPRISE_PLAN,
    ENTERPRISE_PRODUCT_NAME,
    ENTERPRISE_MONTHLY_AMOUNT_CENTS,
    'STRIPE_PRICE_ENTERPRISE_MONTHLY'
  );
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
