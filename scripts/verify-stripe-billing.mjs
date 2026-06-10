#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const failures = [];
const warnings = [];

const requiredServerVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STUDIO_MONTHLY',
  'STRIPE_PRICE_ENTERPRISE_MONTHLY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_PROJECT_ID',
];

const recommendedClientVars = ['VITE_STRIPE_BILLING_ENABLED', 'VITE_PRICING_PAGE_ENABLED'];

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

console.log('Stripe billing env and CSP checks passed.');
console.log('Operator next steps:');
console.log('- Stripe Dashboard (live): Studio $499/mo + Enterprise $1,000/mo prices + webhook to /api/stripe/webhook');
console.log('- Archive old $99 / $249 price IDs in Stripe Dashboard after updating Vercel env vars');
console.log('- Vercel Production: set all STRIPE_* and FIREBASE_* vars, redeploy');
console.log('- Run one live Studio checkout and confirm billing/{uid}.plan=studio in Firestore');
