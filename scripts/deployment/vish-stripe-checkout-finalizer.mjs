#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const valueArg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};

const pagesUrl = new URL(
  valueArg('--pages-url', process.env.CLOUDFLARE_PAGES_URL || 'https://vishvakarma-os.pages.dev'),
);
const projectName = valueArg('--project-name', 'vishvakarma-os');
const expectedBranch = 'agent/cloudflare-pages-workers-migration';
const wranglerVersion = '4.118.0';
const repoRoot = process.cwd();
const localRoot = join(repoRoot, '.local', 'cloudflare-proof');
const authEvidenceRoot = join(repoRoot, 'evidence', 'cloudflare-cutover');
const authStatePath =
  process.env.CLOUDFLARE_AUTH_STATE_PATH ||
  join(repoRoot, '.local', 'cloudflare-auth', 'storage-state.json');
const bootstrapScript = join(repoRoot, 'scripts', 'deployment', 'bootstrap-stripe-cloudflare.mjs');
const liveProofScript = join(repoRoot, 'scripts', 'deployment', 'verify-cloudflare-live.mjs');
const webhookProofScript = join(
  repoRoot,
  'scripts',
  'deployment',
  'verify-cloudflare-server-webhook-proof.mjs',
);
const runId = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const tempRoot = join(tmpdir(), `vish-stripe-finalizer-${process.pid}`);
const stripeOutputPath = join(tempRoot, 'stripe-bootstrap.json');
const cloudflareSecretsPath = join(tempRoot, 'cloudflare-secrets.json');
const resultPath = join(localRoot, `stripe-finalizer-${runId}.json`);
let proofTokenUploaded = false;

mkdirSync(localRoot, { recursive: true });
mkdirSync(tempRoot, { recursive: true });

function commandName(name) {
  if (process.platform !== 'win32') return name;
  if (name === 'npx') return 'npx.cmd';
  return name;
}

function run(command, args, options = {}) {
  const { capture = false, allowFailure = false, input, env = process.env } = options;
  const result = spawnSync(commandName(command), args, {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
    input,
    stdio: capture
      ? ['pipe', 'pipe', 'pipe']
      : input !== undefined
        ? ['pipe', 'inherit', 'inherit']
        : 'inherit',
    windowsHide: false,
  });

  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    const detail = capture
      ? String(result.stderr || result.stdout || '').trim().slice(0, 2000)
      : '';
    throw new Error(
      `${command} ${args.join(' ')} returned exit code ${result.status}${detail ? `: ${detail}` : ''}`,
    );
  }
  return result;
}

function runNode(script, args = [], options = {}) {
  return run(process.execPath, [script, ...args], options);
}

function runNpx(args, options = {}) {
  return run('npx', ['--yes', ...args], options);
}

function importEnvironmentFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, name, rawValue] = match;
    if (process.env[name]) continue;
    process.env[name] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

function stripeConfigCandidates() {
  return [
    join(homedir(), '.config', 'stripe', 'config.toml'),
    process.env.APPDATA ? join(process.env.APPDATA, 'stripe', 'config.toml') : null,
  ].filter(Boolean);
}

function readStripeCliKey() {
  const keyName =
    process.env.VISH_STRIPE_MODE === 'live'
      ? 'live_mode_api_key'
      : 'test_mode_api_key';
  for (const path of stripeConfigCandidates()) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (!new RegExp(`^\\s*${keyName}\\s*=`).test(line)) continue;
      return line
        .split('=')
        .slice(1)
        .join('=')
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return null;
}

function getStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || readStripeCliKey();
  if (!key || !/^(sk|rk)_(test|live)_/.test(key)) {
    throw new Error(
      'No usable Stripe server key was found. Authenticate Stripe CLI or provide STRIPE_SECRET_KEY securely.',
    );
  }
  if (key.startsWith('rk_')) {
    console.warn(
      '[stripe-finalizer] Stripe CLI supplied a restricted key; Checkout permission will be proved before release.',
    );
  }
  return key;
}

function latestAuthEvidence() {
  if (!existsSync(authEvidenceRoot)) return null;
  const files = readdirSync(authEvidenceRoot)
    .filter((name) => /^auth-checkout-.*\.json$/.test(name))
    .map((name) => join(authEvidenceRoot, name))
    .filter((path) => statSync(path).isFile())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] || null;
}

function hasPassed(results, ...names) {
  return names.some((name) =>
    results.some((result) => result.name === name && result.pass === true),
  );
}

function assertStripeOnlyEligibility() {
  const evidencePath = latestAuthEvidence();
  if (!evidencePath) {
    throw new Error('No recent auth/checkout evidence exists; Stripe-only recovery is not safe.');
  }

  const payload = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const results = Array.isArray(payload.results) ? payload.results : [];
  const editorPass = hasPassed(
    results,
    'Saved Supabase password session opens the editor',
    'Saved Supabase session opens the editor',
    'Supabase email/password sign-in returns to editor',
    'Existing authenticated Supabase password state is valid',
  );
  const refreshPass = hasPassed(
    results,
    'Supabase password session persists after refresh',
    'Supabase session persists after refresh',
  );
  const checkoutFailed = results.some(
    (result) => result.name === 'Stripe Checkout opens from the Studio plan' && result.pass !== true,
  );

  if (!editorPass || !refreshPass || !checkoutFailed) {
    throw new Error(
      'The latest evidence is not an auth-passed, Stripe-only failure; refusing focused recovery.',
    );
  }

  console.log(`[stripe-finalizer] Eligible evidence: ${evidencePath}`);
}

function writeSecretFile(values) {
  writeFileSync(cloudflareSecretsPath, `${JSON.stringify(values, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  chmodSync(cloudflareSecretsPath, 0o600);
}

function uploadCloudflareSecrets(values) {
  writeSecretFile(values);
  try {
    runNpx([
      `wrangler@${wranglerVersion}`,
      'pages',
      'secret',
      'bulk',
      cloudflareSecretsPath,
      '--project-name',
      projectName,
    ]);
  } finally {
    rmSync(cloudflareSecretsPath, { force: true });
  }
}

function bootstrapStripe() {
  const stripeKey = getStripeKey();
  process.env.STRIPE_SECRET_KEY = stripeKey;
  rmSync(stripeOutputPath, { force: true });
  runNode(bootstrapScript, ['--output', stripeOutputPath]);
  const payload = JSON.parse(readFileSync(stripeOutputPath, 'utf8'));
  const proofToken = randomBytes(32).toString('base64url');

  uploadCloudflareSecrets({
    STRIPE_SECRET_KEY: payload.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: payload.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_STUDIO_MONTHLY: payload.STRIPE_PRICE_STUDIO_MONTHLY,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: payload.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    APP_URL: payload.APP_URL,
    CLOUDFLARE_PROOF_TOKEN: proofToken,
  });

  process.env.CLOUDFLARE_PROOF_TOKEN = proofToken;
  proofTokenUploaded = true;
  rmSync(stripeOutputPath, { force: true });
}

function deployExactCommit() {
  const head = run('git', ['rev-parse', 'HEAD'], { capture: true }).stdout.trim();
  runNpx([
    `wrangler@${wranglerVersion}`,
    'pages',
    'deploy',
    'dist',
    '--project-name',
    projectName,
    '--branch',
    expectedBranch,
    '--commit-hash',
    head,
    '--commit-message',
    'Vish Stripe checkout focused recovery',
  ]);
  return head;
}

async function verifyExactCommit(head) {
  process.env.EXPECTED_GIT_SHA = head;
  process.env.CLOUDFLARE_PAGES_URL = pagesUrl.origin;
  process.env.PRODUCTION_URL = pagesUrl.origin;

  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const result = runNode(liveProofScript, [], { allowFailure: true, capture: true });
    if (result.status === 0) {
      console.log(result.stdout.trim());
      return;
    }
    lastError = String(result.stderr || result.stdout || '').trim();
    console.log(`[stripe-finalizer] Waiting for exact deployment (${attempt}/6)…`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10_000));
  }
  throw new Error(`Exact Cloudflare deployment did not become ready: ${lastError}`);
}

async function findCheckoutCta(page) {
  for (const locator of [
    page.getByRole('button', { name: /start 14-day free trial/i }),
    page.getByRole('link', { name: /start 14-day free trial/i }),
    page.getByText(/start 14-day free trial/i),
  ]) {
    const first = locator.first();
    if ((await first.count()) > 0 && (await first.isVisible().catch(() => false))) {
      return first;
    }
  }
  return null;
}

function safeApiDetail(status, text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }
  const detail = payload?.error || payload?.message || text || '<empty response>';
  return `HTTP ${status}: ${String(detail).slice(0, 500)}`;
}

async function proveCheckout() {
  if (!existsSync(authStatePath)) {
    throw new Error(`Authenticated browser state is missing: ${authStatePath}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: authStatePath });
  const page = await context.newPage();

  try {
    await page.goto(new URL('/pricing', pagesUrl), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page.waitForTimeout(1200);

    const cta = await findCheckoutCta(page);
    if (!cta) throw new Error('Studio Checkout action is not visible after authenticated reload.');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/stripe/create-checkout-session'),
      { timeout: 60_000 },
    );

    await cta.click({ noWaitAfter: true });
    const response = await responsePromise;
    const text = await response.text().catch(() => '');

    if (!response.ok()) {
      throw new Error(`Checkout API rejected the request — ${safeApiDetail(response.status(), text)}`);
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error('Checkout API returned non-JSON success content.');
    }

    const checkoutUrl = new URL(String(payload?.url || ''));
    const stripeHost =
      checkoutUrl.hostname === 'checkout.stripe.com' ||
      checkoutUrl.hostname.endsWith('.checkout.stripe.com') ||
      checkoutUrl.hostname === 'payments.stripe.com' ||
      checkoutUrl.hostname.endsWith('.payments.stripe.com');
    if (checkoutUrl.protocol !== 'https:' || !stripeHost) {
      throw new Error('Checkout API did not return a trusted Stripe-hosted URL.');
    }

    await page.waitForURL(
      (url) =>
        url.hostname === 'checkout.stripe.com' ||
        url.hostname.endsWith('.checkout.stripe.com') ||
        url.hostname === 'payments.stripe.com' ||
        url.hostname.endsWith('.payments.stripe.com'),
      { timeout: 60_000 },
    );

    console.log(`[PASS] Stripe Checkout opened on ${page.url() ? new URL(page.url()).hostname : checkoutUrl.hostname}.`);
    return {
      status: response.status(),
      stripeHost: checkoutUrl.hostname,
      checkoutSessionCreated: true,
    };
  } finally {
    await browser.close().catch(() => null);
  }
}

function proveWebhook() {
  const result = runNode(webhookProofScript, [], {
    allowFailure: true,
    capture: true,
    env: {
      ...process.env,
      CLOUDFLARE_PAGES_URL: pagesUrl.origin,
      PRODUCTION_URL: pagesUrl.origin,
    },
  });
  const output = String(result.stdout || result.stderr || '').trim();
  if (result.status !== 0) {
    throw new Error(`Signed Stripe webhook proof failed: ${output.slice(0, 1000)}`);
  }
  console.log(output);
}

async function removeProofToken() {
  if (!proofTokenUploaded) return;
  runNpx(
    [
      `wrangler@${wranglerVersion}`,
      'pages',
      'secret',
      'delete',
      'CLOUDFLARE_PROOF_TOKEN',
      '--project-name',
      projectName,
    ],
    { allowFailure: true, input: 'y\n' },
  );
}

const result = {
  generatedAt: new Date().toISOString(),
  result: 'BLOCKED',
  detail: null,
  target: pagesUrl.origin,
  gitHead: null,
  checkout: null,
};

try {
  console.log('VISHVAKARMA.OS STRIPE CHECKOUT FOCUSED FINALIZER');
  const branch = run('git', ['branch', '--show-current'], { capture: true }).stdout.trim();
  if (branch !== expectedBranch) throw new Error(`Wrong branch: ${branch}`);
  if (!existsSync(join(repoRoot, 'dist', 'index.html'))) {
    throw new Error('Built Cloudflare artifact is missing; focused Stripe recovery cannot continue.');
  }

  for (const name of ['.env.stripe.local', '.env.local', '.dev.vars.local', '.dev.vars']) {
    importEnvironmentFile(join(repoRoot, name));
  }

  assertStripeOnlyEligibility();
  bootstrapStripe();
  result.gitHead = deployExactCommit();
  await verifyExactCommit(result.gitHead);
  result.checkout = await proveCheckout();
  proveWebhook();

  result.result = 'PASS';
  result.detail = 'Authenticated Stripe Checkout and server-signed webhook proof passed after focused recovery.';
  console.log('\nVISH STRIPE CHECKOUT FINALIZER: PASS');
  process.exitCode = 0;
} catch (error) {
  result.result = 'BLOCKED';
  result.detail = error instanceof Error ? error.message : String(error);
  console.error('\nVISH STRIPE CHECKOUT FINALIZER: BLOCKED');
  console.error(result.detail);
  console.error('No secret values were printed or committed.');
  process.exitCode = 1;
} finally {
  result.completedAt = new Date().toISOString();
  writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Finalizer evidence: ${resultPath}`);
  await removeProofToken();
  rmSync(tempRoot, { recursive: true, force: true });
}
