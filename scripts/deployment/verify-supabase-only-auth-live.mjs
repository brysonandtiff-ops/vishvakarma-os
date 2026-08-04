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

      const visible = async (testId) =>
        page.getByTestId(testId).isVisible().catch(() => false);

      const badgeVisible = await visible('supabase-auth-badge');
      const badgeText = badgeVisible
        ? await page.getByTestId('supabase-auth-badge').textContent()
        : '';
      const emailVisible = await visible('supabase-email-input');
      const passwordVisible = await visible('supabase-password-input');
      const signInVisible = await visible('supabase-password-button');
      const createModeVisible = await visible('auth-mode-create-account');
      const forgotPasswordVisible = await visible('supabase-forgot-password-button');
      const googleCount = await page.getByTestId('google-sso-button').count();
      const magicLinkCount = await page.getByTestId('email-magic-link-button').count();

      let createAccountVisible = false;
      let confirmPasswordVisible = false;
      if (createModeVisible) {
        await page.getByTestId('auth-mode-create-account').click();
        confirmPasswordVisible = await visible('supabase-confirm-password-input');
        createAccountVisible = await visible('supabase-create-account-button');
        await page.getByTestId('auth-mode-sign-in').click();
      }

      const resetResponse = await page.goto(
        `${baseOrigin}/reset-password?proof=${Date.now()}`,
        { waitUntil: 'domcontentloaded', timeout: 45_000 },
      );
      await page.waitForTimeout(800);
      const recoveryEmailVisible = await visible('recovery-email-input');
      const recoverySendVisible = await visible('recovery-send-email-button');

      const pass =
        response?.ok() === true &&
        resetResponse?.ok() === true &&
        badgeVisible &&
        badgeText?.includes('Supabase Auth') &&
        badgeText?.includes('Connected') &&
        emailVisible &&
        passwordVisible &&
        signInVisible &&
        createModeVisible &&
        forgotPasswordVisible &&
        confirmPasswordVisible &&
        createAccountVisible &&
        recoveryEmailVisible &&
        recoverySendVisible &&
        googleCount === 0 &&
        magicLinkCount === 0;

      if (pass) {
        console.log('LIVE SUPABASE ACCOUNT LIFECYCLE: PASS');
        console.log(`Auth: ${baseOrigin}/auth`);
        console.log(`Recovery: ${baseOrigin}/reset-password`);
        console.log('Badge: Supabase Auth • Connected');
        console.log('Controls: sign in + create account + forgot password + recovery');
        console.log('Removed: Google SSO + email magic link');
        process.exitCode = 0;
        break;
      }

      lastDetail = JSON.stringify({
        authStatus: response?.status() ?? null,
        resetStatus: resetResponse?.status() ?? null,
        badgeVisible,
        emailVisible,
        passwordVisible,
        signInVisible,
        createModeVisible,
        forgotPasswordVisible,
        confirmPasswordVisible,
        createAccountVisible,
        recoveryEmailVisible,
        recoverySendVisible,
        googleCount,
        magicLinkCount,
      });
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
    }

    if (Date.now() >= deadline) {
      console.error('LIVE SUPABASE ACCOUNT LIFECYCLE: FAILED');
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
