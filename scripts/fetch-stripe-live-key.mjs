#!/usr/bin/env node
/**
 * Attempts to read the live secret key from Stripe Dashboard using Playwright + Chrome profile.
 * Writes STRIPE_SECRET_KEY into .env.stripe.local when found.
 *
 * Usage: node scripts/fetch-stripe-live-key.mjs
 */

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ENV_PATH = '.env.stripe.local';
const API_KEYS_URL = 'https://dashboard.stripe.com/apikeys';

function upsertEnv(key, value) {
  const lines = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8').split('\n') : [];
  const map = new Map();
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  map.set(key, value);
  const output = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n');
  writeFileSync(ENV_PATH, `${output}\n`, 'utf8');
}

async function main() {
  const userDataDir = join(homedir(), '.vishvakarma-stripe-playwright');
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(API_KEYS_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log('[INFO] Sign in to Stripe Dashboard if prompted. Waiting up to 3 minutes for sk_live_...');

    let match = null;
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const revealButtons = page.locator('button:has-text("Reveal"), button:has-text("Reveal live key")');
      const count = await revealButtons.count();
      for (let i = 0; i < count; i += 1) {
        await revealButtons.nth(i).click({ timeout: 3000 }).catch(() => undefined);
      }
      await page.waitForTimeout(5000);
      const bodyText = await page.locator('body').innerText();
      match = bodyText.match(/sk_live_[A-Za-z0-9]+/);
      if (match) break;
    }

    if (!match) {
      throw new Error(
        'Live secret key not found. Sign in to Stripe Dashboard in the opened browser, then re-run this script.'
      );
    }

    upsertEnv('STRIPE_SECRET_KEY', match[0]);
    console.log('[OK] STRIPE_SECRET_KEY saved to .env.stripe.local');
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
