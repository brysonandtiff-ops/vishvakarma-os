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
import { openExternalUrl, resolveChromeExecutable } from './open-external-url.mjs';

const ENV_PATH = '.env.stripe.local';
const ACCOUNT_ID = process.env.STRIPE_ACCOUNT_ID?.trim() || 'acct_1SnNEDL5pWZeI0CX';
const API_KEYS_URL =
  process.env.STRIPE_API_KEYS_URL?.trim() ||
  `https://dashboard.stripe.com/${ACCOUNT_ID}/apikeys`;

async function findLiveSecretKey(page) {
  const revealButtons = page.locator(
    'button:has-text("Reveal live key"), button:has-text("Reveal test key"), button:has-text("Reveal")'
  );
  const count = await revealButtons.count();
  for (let i = 0; i < count; i += 1) {
    await revealButtons.nth(i).click({ timeout: 3000 }).catch(() => undefined);
  }

  const snippets = await page.locator('code, pre, input, [data-testid*="secret"], [class*="Secret"]').allTextContents();
  const bodyText = await page.locator('body').innerText();
  for (const raw of [...snippets, bodyText]) {
    const text = String(raw ?? '');
    const match = text.match(/sk_live_[A-Za-z0-9]+/);
    if (match) return match[0];
  }

  return null;
}

async function ensureLiveMode(page) {
  const testModeToggle = page.locator('text=/View test data|Test mode/i').first();
  if (await testModeToggle.isVisible().catch(() => false)) {
    await testModeToggle.click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
  }
}

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

async function launchStripeDashboard() {
  const chromePath = resolveChromeExecutable();
  const userDataDir = join(homedir(), '.vishvakarma-stripe-playwright');

  if (chromePath) {
    try {
      const context = await chromium.launchPersistentContext(userDataDir, {
        executablePath: chromePath,
        headless: false,
        viewport: { width: 1280, height: 900 },
      });
      return { context, method: 'playwright-chrome' };
    } catch (error) {
      console.warn(
        `[WARN] Playwright could not launch Chrome at ${chromePath}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  try {
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 900 },
    });
    return { context, method: 'playwright-channel' };
  } catch (error) {
    console.warn(
      `[WARN] Playwright channel=chrome failed: ${error instanceof Error ? error.message : error}`
    );
  }

  const opened = openExternalUrl(API_KEYS_URL, { preferChrome: true });
  if (opened.ok) {
    console.log(`[INFO] Opened Stripe API keys in ${opened.method}.`);
    console.log('[INFO] Copy sk_live_... from the page into .env.stripe.local as STRIPE_SECRET_KEY.');
    console.log(`[INFO] URL: ${API_KEYS_URL}`);
    return { context: null, method: opened.method };
  }

  throw new Error(
    'Could not launch Chrome. Install Google Chrome or set CHROME_PATH, then re-run this script.'
  );
}

async function main() {
  const { context, method } = await launchStripeDashboard();
  if (!context) {
    process.exit(0);
  }

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(API_KEYS_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await ensureLiveMode(page);
    console.log(`[INFO] Stripe Dashboard opened via ${method} (${API_KEYS_URL}).`);
    console.log('[INFO] Sign in if prompted. Keep this window open — waiting up to 3 minutes for sk_live_...');

    let match = null;
    for (let attempt = 0; attempt < 36; attempt += 1) {
      match = await findLiveSecretKey(page);
      if (match) break;
      await page.waitForTimeout(5000).catch(() => {
        throw new Error('Browser window closed before sk_live_ could be read. Re-run and keep Chrome open.');
      });
    }

    if (!match) {
      throw new Error(
        'Live secret key not found. Sign in to Stripe Dashboard in the opened browser, then re-run this script.'
      );
    }

    upsertEnv('STRIPE_SECRET_KEY', match);
    console.log('[OK] STRIPE_SECRET_KEY saved to .env.stripe.local');
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
