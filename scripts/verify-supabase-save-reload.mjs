#!/usr/bin/env node
/**
 * Live Supabase save/reload proof for production launch evidence.
 *
 * Modes:
 *   default / --interactive   Headed browser — operator completes Google sign-in
 *   --api-only                DIAGNOSTIC ONLY: service-role Postgres roundtrip (no user auth/RLS proof)
 *   --skip-interactive        Print runbook and exit 0 (NEVER a release proof)
 *   --write-evidence          Update save-load-proof.md + JSON artifact on success
 *
 * Run: pnpm run verify:supabase-save-reload
 *      pnpm run verify:supabase-save-reload -- --api-only --write-evidence
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { CANONICAL_ORIGIN } from './lib/canonical-origin.mjs';
import { REQUIRED_CLOUD_BROWSER_CHECKS, validateCloudSaveEvidence } from './lib/save-reload-evidence.mjs';
import { runServiceRoleProjectDiagnostic } from './lib/supabase-api-diagnostic.mjs';

const BASE = process.env.PRODUCTION_URL ?? CANONICAL_ORIGIN;
const EDITOR_URL = `${BASE}/editor`;
const PROJECTS_URL = `${BASE}/projects`;
const skipInteractive = process.argv.includes('--skip-interactive');
const apiOnly = process.argv.includes('--api-only');
const writeEvidence = process.argv.includes('--write-evidence');
const evidenceDir = join(process.cwd(), 'docs', 'release', 'evidence');
const runArtifactPath = join(evidenceDir, 'save-load-proof-run.json');

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(pass ? '[PASS]' : '[FAIL]', name, detail);
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function getCommitSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function manifestFingerprint(manifest) {
  const walls = manifest?.walls?.length ?? 0;
  const openings = manifest?.openings?.length ?? 0;
  const hash = createHash('sha256').update(JSON.stringify(manifest)).digest('hex').slice(0, 12);
  return { walls, openings, hash };
}

async function dismissEditorOverlays(page) {
  const skipWelcome = page.getByRole('button', { name: /skip.*start drawing/i });
  if (await skipWelcome.isVisible().catch(() => false)) {
    await skipWelcome.click({ force: true });
  }

  const declineAnalytics = page.getByRole('button', { name: /decline/i });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click({ force: true });
  }

  const recoveryDiscard = page.getByRole('button', { name: /discard draft/i });
  if (await recoveryDiscard.isVisible().catch(() => false)) {
    await recoveryDiscard.click({ force: true });
  }

  const tutorialSkip = page.getByRole('button', { name: /skip tutorial/i });
  if (await tutorialSkip.isVisible().catch(() => false)) {
    await tutorialSkip.click({ force: true });
  }
}

async function openProjectActionsMenu(page) {
  await page.getByRole('button', { name: /project actions/i }).click();
}

async function loadSampleProject(page) {
  await openProjectActionsMenu(page);
  await page.getByRole('menuitem', { name: /load sample blueprint/i }).click();
  await page.getByRole('dialog', { name: /load sample blueprint/i }).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: /load blueprint/i }).click();
  await page.getByTestId('blueprint-canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await page
    .waitForFunction(
      () => {
        const bar = document.querySelector('.ws-status-bar');
        const text = bar?.textContent ?? '';
        const match = text.match(/Walls:\s*(\d+)/i);
        return Boolean(match && Number(match[1]) > 0);
      },
      { timeout: 30_000 },
    )
    .catch(() => {});
}

async function readStatusCounts(page) {
  const text = (await page.locator('.ws-status-bar').textContent()) ?? '';
  const walls = Number(text.match(/Walls:\s*(\d+)/i)?.[1] ?? 0);
  const openings = Number(text.match(/Openings:\s*(\d+)/i)?.[1] ?? 0);
  return { walls, openings, text: text.trim() };
}

async function runApiRoundtrip(env) {
  const url = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) {
    record('api: service role env', false, 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }
  const designatedUserId = env.SUPABASE_E2E_TEST_USER_ID ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(designatedUserId)) {
    record('api: dedicated diagnostic user required', false,
      'Set SUPABASE_E2E_TEST_USER_ID; refusing to select an arbitrary real user');
    return false;
  }
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sample = JSON.parse(readFileSync(join(process.cwd(), 'public', 'samples', 'sample-house-01.json'), 'utf8'));
  return runServiceRoleProjectDiagnostic({ client, sample, userId: designatedUserId, record });
}

async function runInteractiveBrowser() {
  console.log('\n[INTERACTIVE] Opening headed browser — complete Google sign-in, then wait for automation.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const projectName = `SaveReload Proof ${Date.now()}`;

  try {
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForURL('**/auth**', { timeout: 30_000 });

    await page.getByRole('button', { name: /continue with google/i }).click();
    await page.waitForURL('**/editor**', { timeout: 180_000 });
    record('browser: Google sign-in → /editor', page.url().includes('/editor'), page.url());

    await dismissEditorOverlays(page);

    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /new project/i }).click();
    await page.getByLabel('Project Name').fill(projectName);
    await page.getByRole('button', { name: /create project/i }).click();
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 30_000 });

    await loadSampleProject(page);
    const before = await readStatusCounts(page);
    record(
      'browser: sample loaded',
      before.walls > 0,
      `Walls: ${before.walls}, Openings: ${before.openings}`,
    );

    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /^save$/i }).click();

    const cloudSaved = page.getByText(/^project saved$/i);
    const localSaved = page.getByText(/project saved locally/i);
    await Promise.race([
      cloudSaved.waitFor({ state: 'visible', timeout: 20_000 }),
      localSaved.waitFor({ state: 'visible', timeout: 20_000 }),
    ]).catch(() => {});

    const savedLocally = await localSaved.isVisible().catch(() => false);
    const savedCloud = await cloudSaved.isVisible().catch(() => false);
    record(
      'browser: cloud save toast',
      savedCloud && !savedLocally,
      savedLocally ? 'saved locally (not cloud)' : savedCloud ? 'Project saved' : 'no save toast',
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    record('browser: hard refresh', true, page.url());

    await page.goto(PROJECTS_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('heading', { name: projectName, exact: true }).click({ timeout: 30_000 });
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 30_000 });
    await dismissEditorOverlays(page);

    const after = await readStatusCounts(page);
    const countsMatch = after.walls === before.walls && after.openings === before.openings;
    record(
      'browser: reload preserves counts',
      countsMatch,
      `before ${before.walls}/${before.openings} → after ${after.walls}/${after.openings}`,
    );

    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /^export$/i }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByTestId('export-json-button').click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    const exportText = exportPath ? readFileSync(exportPath, 'utf8') : '';
    const exported = JSON.parse(exportText);
    const exportCounts = manifestFingerprint(exported);
    const exportMatch = exportCounts.walls === before.walls && exportCounts.openings === before.openings;
    record(
      'browser: export JSON counts',
      exportMatch,
      `walls ${exportCounts.walls}, openings ${exportCounts.openings}`,
    );

    return savedCloud && countsMatch && exportMatch;
  } catch (error) {
    record(
      'browser: save/reload flow',
      false,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  } finally {
    await browser.close();
  }
}

function printRunbook() {
  console.log(`
Supabase save/reload proof runbook
──────────────────────────────────
1. Ensure .env.local has VITE_SUPABASE_* (and SUPABASE_SERVICE_ROLE_KEY for --api-only).
2. Run: pnpm run verify:supabase-save-reload
3. Complete Google sign-in in the headed browser window.
4. Wait for automation to finish (save → refresh → reload → export).
5. Re-run with --write-evidence after a green run to update launch evidence.

API-only (Postgres roundtrip, no browser):
  pnpm run verify:supabase-save-reload -- --api-only --write-evidence
`);
}

function writeEvidenceFiles(mode, pass) {
  const sha = getCommitSha();
  const generatedAt = new Date().toISOString();
  const diagnosticOnly = mode !== 'interactive';
  const completeBrowserProof = !diagnosticOnly && pass &&
    REQUIRED_CLOUD_BROWSER_CHECKS.every((name) =>
      results.filter((check) => check.name === name && check.pass === true).length === 1,
    );
  const runArtifact = {
    generatedAt,
    commitSha: sha,
    deploymentUrl: BASE,
    mode,
    operator: diagnosticOnly ? 'service-role API diagnostic (not user auth evidence)' : 'interactive authenticated browser proof',
    result: pass ? 'PASS' : 'FAIL',
    certified: completeBrowserProof,
    scope: diagnosticOnly ? 'diagnostic-only: RLS/auth/browser not proven' : 'authenticated-browser save-refresh-reopen-export',
    checks: results,
  };
  // Never overwrite a genuine authenticated-browser receipt with an elevated
  // API diagnostic. Keep diagnostic evidence in a separate, nonrelease file.
  const artifactPath = diagnosticOnly
    ? join(evidenceDir, 'save-load-api-diagnostic-run.json')
    : runArtifactPath;
  writeFileSync(artifactPath, `${JSON.stringify(runArtifact, null, 2)}\n`);

  const failures = validateCloudSaveEvidence(runArtifact, sha);
  if (failures.length > 0) {
    console.log(`[INFO] Saved ${artifactPath} (diagnostic receipt only; production proof unchanged)`);
    for (const failure of failures) console.log(`[HOLD] ${failure}`);
    return;
  }

  // Only observed, authenticated browser operations are asserted below.
  // Do not claim import, console auditing, or physical device checks that were not run.
  const steps = [
    '| 1 | Google sign-in | Browser returned to /editor after login | PASS |',
    '| 2 | Load sample | Real browser observed nonzero walls | PASS |',
    '| 3 | Save to cloud | Cloud save toast appeared; local save toast absent | PASS |',
    '| 4 | Refresh and reopen | Saved project reopened with unchanged wall and opening counts | PASS |',
    '| 5 | Export JSON | Exported JSON wall/opening counts matched before refresh | PASS |',
  ];
  const document = [
    '# Save / Load Determinism Proof',
    '',
    `Generated from commit: \`${sha}\``,
    `Deployment URL: ${BASE}`,
    `Generated at: ${generatedAt}`,
    'Operator: interactive authenticated browser proof',
    'Result: `PASS`',
    '',
    '## Observed authenticated browser steps',
    '| Step | Action | Observed result | Status |',
    '|---|---|---|---|',
    ...steps,
    '',
    '## Compare wall/opening counts',
    'The before/after and exported model wall/opening counts were compared by the live browser test.',
    'No import cycle, console-error audit, RLS tenant-isolation proof, or mobile-device execution is claimed here.',
    '',
    `Artifact: docs/release/evidence/save-load-proof-run.json`,
    '',
  ].join('\n');
  writeFileSync(join(evidenceDir, 'save-load-proof.md'), document);
  console.log('[OK] Wrote verified interactive-browser-only save/reload documentation');
  console.log(`[OK] Wrote ${runArtifactPath}`);
}

async function main() {
  if (skipInteractive && !apiOnly) {
    printRunbook();
    if (writeEvidence) {
      console.error('[FAIL] Runbook-only mode cannot generate a cloud save/reload release receipt.');
      process.exit(1);
    }
    process.exit(0);
  }

  const env = { ...process.env, ...loadEnvLocal() };
  let pass = false;
  let mode = 'interactive';

  if (apiOnly) {
    mode = 'api-roundtrip';
    pass = await runApiRoundtrip(env);
  } else {
    pass = await runInteractiveBrowser();
  }

  console.log('\n--- Summary ---');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} | ${r.name} | ${r.detail}`);
  }

  if (writeEvidence) {
    writeEvidenceFiles(mode, pass);
  } else if (pass) {
    console.log('\n[INFO] Proof passed. Re-run with --write-evidence to update launch docs.');
  }

  if (!pass) {
    console.error(`\nFAILED: ${results.filter((r) => !r.pass).length}/${results.length} checks`);
    process.exit(1);
  }

  console.log(`\nALL CHECKS PASSED: ${results.length} (${mode})`);
}

main().catch((error) => {
  console.error('[FAIL]', error);
  process.exit(1);
});
