#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFile } from './load-env-file.mjs';

loadEnvFile(join(process.cwd(), '.env.stripe.local'));
loadEnvFile(join(process.cwd(), '.env.local'));

const strict = process.argv.includes('--strict');
const failures = [];
const warnings = [];

function resolveBillingBackendProvider() {
  return (process.env.BACKEND_PROVIDER ?? process.env.VITE_BACKEND_PROVIDER ?? 'supabase')
    .trim()
    .toLowerCase();
}

const billingBackend = resolveBillingBackendProvider();

const requiredServerVars =
  billingBackend === 'supabase'
    ? [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRICE_STUDIO_MONTHLY',
        'STRIPE_PRICE_ENTERPRISE_MONTHLY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_URL',
      ]
    : [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRICE_STUDIO_MONTHLY',
        'STRIPE_PRICE_ENTERPRISE_MONTHLY',
        'FIREBASE_SERVICE_ACCOUNT_JSON',
        'FIREBASE_PROJECT_ID',
      ];

const recommendedClientVars = [
  'VITE_STRIPE_BILLING_ENABLED',
  'VITE_PRICING_PAGE_ENABLED',
  'BACKEND_PROVIDER',
  'VITE_BACKEND_PROVIDER',
];

const EXPECTED_PRICE_AMOUNTS = {
  STRIPE_PRICE_STUDIO_MONTHLY: 49900,
  STRIPE_PRICE_ENTERPRISE_MONTHLY: 100000,
};

async function stripeRequest(secretKey, path) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe API ${response.status}`);
  }
  return payload;
}

async function verifyStripePrices(secretKey) {
  for (const [envName, expectedAmount] of Object.entries(EXPECTED_PRICE_AMOUNTS)) {
    const priceId = process.env[envName]?.trim();
    if (!priceId) continue;

    try {
      const price = await stripeRequest(secretKey, `/prices/${priceId}`);
      if (price.active !== true) {
        failures.push(`${envName} (${priceId}) is not active in Stripe.`);
      }
      if (price.unit_amount !== expectedAmount) {
        failures.push(
          `${envName} (${priceId}) is $${(price.unit_amount / 100).toFixed(0)}/mo — expected $${(expectedAmount / 100).toFixed(0)}/mo.`
        );
      }
      if (price.recurring?.interval !== 'month') {
        failures.push(`${envName} (${priceId}) must be a monthly recurring price.`);
      }
    } catch (error) {
      failures.push(
        `${envName} (${priceId}) could not be verified: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}

async function verifyStripeAccount(secretKey) {
  try {
    const account = await stripeRequest(secretKey, '/account');
    if (strict && account.charges_enabled !== true) {
      warnings.push('Stripe account charges_enabled=false — complete live activation in Dashboard.');
    }
    if (strict && account.details_submitted !== true) {
      warnings.push('Stripe account details_submitted=false — complete business profile in Dashboard.');
    }
  } catch (error) {
    failures.push(`STRIPE_SECRET_KEY could not access Stripe account: ${error instanceof Error ? error.message : error}`);
  }
}

function checkEnvVar(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    failures.push(`Missing required env var: ${name}`);
    return;
  }

  if (name === 'STRIPE_SECRET_KEY' && strict && !value.startsWith('sk_live_')) {
    warnings.push('STRIPE_SECRET_KEY is not a live key (expected sk_live_...).');
  }

  if (name === 'STRIPE_PRICE_STUDIO_MONTHLY' && !value.startsWith('price_')) {
    failures.push('STRIPE_PRICE_STUDIO_MONTHLY must be a Stripe Price ID (price_...).');
  }

  if (name === 'STRIPE_PRICE_ENTERPRISE_MONTHLY' && !value.startsWith('price_')) {
    failures.push('STRIPE_PRICE_ENTERPRISE_MONTHLY must be a Stripe Price ID (price_...).');
  }
}

for (const name of requiredServerVars) {
  checkEnvVar(name);
}

for (const name of recommendedClientVars) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    warnings.push(`Recommended env var not set: ${name}`);
  } else if (name === 'VITE_PRICING_PAGE_ENABLED' && value !== 'true') {
    warnings.push('VITE_PRICING_PAGE_ENABLED is not true — /pricing will 404 in production builds.');
  } else if (name === 'VITE_STRIPE_BILLING_ENABLED' && value !== 'true') {
    warnings.push('VITE_STRIPE_BILLING_ENABLED is not true — checkout buttons stay in fallback mode.');
  } else if (name === 'BACKEND_PROVIDER' && value !== billingBackend) {
    warnings.push(`BACKEND_PROVIDER is "${value}" but expected "${billingBackend}".`);
  } else if (name === 'VITE_BACKEND_PROVIDER' && value !== billingBackend) {
    warnings.push(`VITE_BACKEND_PROVIDER is "${value}" but expected "${billingBackend}".`);
  }
}

const vercelPath = join(process.cwd(), 'vercel.json');
if (existsSync(vercelPath)) {
  const config = JSON.parse(readFileSync(vercelPath, 'utf8'));
  const csp = (config.headers ?? [])
    .flatMap((entry) => entry.headers ?? [])
    .find((header) => header.key === 'Content-Security-Policy')?.value;

  for (const token of ['https://js.stripe.com', 'https://checkout.stripe.com', 'https://api.stripe.com']) {
    if (!csp?.includes(token)) {
      failures.push(`vercel.json CSP missing Stripe allowlist: ${token}`);
    }
  }
} else {
  failures.push('Missing vercel.json');
}

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (secretKey) {
  await verifyStripeAccount(secretKey);
  await verifyStripePrices(secretKey);
}

if (warnings.length > 0) {
  console.warn('Stripe billing verification warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error('Stripe billing verification failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Stripe billing env, CSP, and live Stripe API checks passed.');
console.log('Operator next steps:');
console.log('- Stripe Dashboard (live): Studio $499/mo + Enterprise $1,000/mo prices + webhook to /api/stripe/webhook');
console.log('- Archive old $99 / $249 price IDs in Stripe Dashboard after updating Vercel env vars');
console.log('- Vercel Production: set all STRIPE_* and backend vars, redeploy');
console.log(
  billingBackend === 'supabase'
    ? '- Run one live Studio checkout and confirm billing/{uid}.plan=studio in Supabase'
    : '- Run one live Studio checkout and confirm billing/{uid}.plan=studio in Firestore'
);
