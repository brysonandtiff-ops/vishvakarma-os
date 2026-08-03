#!/usr/bin/env node

import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const valueArg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};

const baseOrigin = new URL(
  valueArg('--pages-url', process.env.CLOUDFLARE_PAGES_URL || 'https://vishvakarma-os.pages.dev'),
).origin;
const waitSeconds = Number(valueArg('--wait-seconds', '600'));
const deadline = Date.now() + Math.max(30, waitSeconds) * 1000;

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  let lastDetail = 'not checked';

  while (Date.now() < deadline) {
    try {
      const response = await page.goto(`${baseOrigin}/auth?proof=${Date.now()}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      await page.waitForTimeout(1200);

      const badge = page.getByTestId('supabase-auth-badge');
      const email = page.getByTestId('supabase-email-input');
      const password = page.getByTestId('supabase-password-input');
      const submit = page.getByTestId('supabase-password-button');
      const google = page.getByTestId('google-sso-button');
      const magicLink = page.getByTestId('email-magic-link-button');

      const badgeVisible = await badge.isVisible().catch(() => false);
      const badgeText = badgeVisible ? await badge.textContent() : '';
      const emailVisible = await email.isVisible().catch(() => false);
      const passwordVisible = await password.isVisible().catch(() => false);
      const submitVisible = await submit.isVisible().catch(() => false);
      const googleCount = await google.count();
      const magicLinkCount = await magicLink.count();

      const pass =
        response?.ok() === true &&
        badgeVisible &&
        badgeText?.includes('Supabase Auth') &&
        badgeText?.includes('Connected') &&
        emailVisible &&
        passwordVisible &&
        submitVisible &&
        googleCount === 0 &&
        magicLinkCount === 0;

      if (pass) {
        console.log('LIVE SUPABASE-ONLY AUTH SURFACE: PASS');
        console.log(`Target: ${baseOrigin}/auth`);
        console.log('Badge: Supabase Auth • Connected');
        console.log('Controls: email + password + Supabase submit');
        console.log('Removed: Google SSO + email magic link');
        process.exitCode = 0;
        break;
      }

      lastDetail = JSON.stringify({
        status: response?.status() ?? null,
        badgeVisible,
        badgeText,
        emailVisible,
        passwordVisible,
        submitVisible,
        googleCount,
        magicLinkCount,
      });
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
    }

    if (Date.now() >= deadline) {
      console.error('LIVE SUPABASE-ONLY AUTH SURFACE: FAILED');
      console.error(`Last observation: ${lastDetail}`);
      process.exitCode = 1;
      break;
    }

    console.log(`[auth-live] Waiting for Cloudflare deployment: ${lastDetail}`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
} finally {
  await browser.close().catch(() => null);
}
