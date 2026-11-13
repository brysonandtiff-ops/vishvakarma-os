#!/usr/bin/env node
/**
 * Live Supabase save/reload proof for production launch evidence.
 *
 * Modes:
 *   default / --interactive   Headed browser — operator completes Google sign-in
 *   --api-only                Database API-only diagnostic. NEVER browser/release proof.
 *   --skip-interactive        Print runbook and exit 0 (CI without credentials)
 *   --write-evidence          Write JSON diagnostics; update Markdown ONLY after complete real browser proof.
 *
 * Browser prerequisites: PRODUCTION_URL=https://<8-hex-deployment>.vishvakarma-os.pages.dev
 *   and CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DEPLOYMENT_ID, CLOUDFLARE_API_TOKEN
 *   securely provided in the process environment (token requires Pages Read).
 *   Keep credential values out of chat and logs. The default canonical URL is
 *   intentionally held until trusted canonical-to-deployment mapping exists.
 * Run after setting these prerequisites: pnpm run verify:supabase-save-reload
 *      SUPABASE_PROOF_USER_ID=<dedicated-test-uuid> pnpm run verify:supabase-save-reload -- --api-only --allow-live-test-data-write --write-evidence
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { CANONICAL_ORIGIN, CLOUDFLARE_PAGES_ORIGIN } from './lib/canonical-origin.mjs';
import { isVerifiedBrowserSaveLoadProof, REQUIRED_BROWSER_SAVE_LOAD_CHECKS } from './lib/save-load-proof-verdict.mjs';
import { validateApiProofTarget } from './lib/api-proof-guard.mjs';
import { attestCloudflareDeployment } from './lib/cloudflare-deployment-proof.mjs';

const BASE = process.env.PRODUCTION_URL ?? CANONICAL_ORIGIN;
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

async function waitForStatusCounts(page, expected) {
  await page.waitForFunction(({ walls, openings }) => {
    const text = document.querySelector('.ws-status-bar')?.textContent ?? '';
    const wallMatch = text.match(/Walls:\s*(\d+)/i);
    const openingMatch = text.match(/Openings:\s*(\d+)/i);
    return wallMatch && openingMatch &&
      Number(wallMatch[1]) === walls && Number(openingMatch[1]) === openings;
  }, expected, { timeout: 15_000 });
  return readStatusCounts(page);
}

async function runApiRoundtrip(env) {
  const target = validateApiProofTarget(process.argv, env);
  if (!target.ok) {
    record('api: dedicated test-account write guard', false, target.reason);
    return false;
  }

  const url = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) {
    record('api: service role env', false, 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('id', target.userId)
    .maybeSingle();
  if (profileError || !profile?.id) {
    record('api: dedicated test profile exists', false, 'Dedicated test profile is not accessible.');
    return false;
  }

  const sample = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'samples', 'sample-house-01.json'), 'utf8'),
  );
  const before = manifestFingerprint(sample);
  const projectName = `S.I.R.E. API diagnostic ${new Date().toISOString()}`;
  let insertedId = null;
  let passed = false;
  let cleanupVerified = false;

  try {
    const { data: inserted, error: insertError } = await client
      .from('projects')
      .insert({
        user_id: target.userId,
        name: projectName,
        description: 'Explicitly approved isolated API diagnostic; not browser proof',
        manifest: sample,
      })
      .select('id')
      .single();
    if (insertError || !inserted?.id) throw new Error('Test-row insertion failed.');
    insertedId = inserted.id;
    record('api: insert isolated project', true, 'Test row created.');

    const { data: fetched, error: fetchError } = await client
      .from('projects')
      .select('manifest')
      .eq('id', insertedId)
      .eq('user_id', target.userId)
      .single();
    if (fetchError || !fetched) throw new Error('Test-row read failed.');
    const afterInsert = manifestFingerprint(fetched.manifest);
    const insertMatch = afterInsert.walls === before.walls && afterInsert.openings === before.openings;
    record('api: counts after insert', insertMatch, `walls ${afterInsert.walls}, openings ${afterInsert.openings}`);
    if (!insertMatch) throw new Error('Inserted test geometry counts changed.');

    const updatedManifest = {
      ...sample,
      name: `${sample.name} (updated)`,
      metadata: { ...(sample.metadata ?? {}), saveReloadProof: new Date().toISOString() },
    };
    const { error: updateError } = await client
      .from('projects')
      .update({ manifest: updatedManifest, updated_at: new Date().toISOString() })
      .eq('id', insertedId)
      .eq('user_id', target.userId);
    if (updateError) throw new Error('Test-row update failed.');

    const { data: refetched, error: refetchError } = await client
      .from('projects')
      .select('manifest')
      .eq('id', insertedId)
      .eq('user_id', target.userId)
      .single();
    if (refetchError || !refetched) throw new Error('Updated test-row reload failed.');
    const afterUpdate = manifestFingerprint(refetched.manifest);
    const updateMatch = afterUpdate.walls === before.walls && afterUpdate.openings === before.openings;
    record('api: counts after update', updateMatch, `walls ${afterUpdate.walls}, openings ${afterUpdate.openings}`);
    if (!updateMatch) throw new Error('Updated test geometry counts changed.');
    passed = true;
  } catch (error) {
    record('api: isolated roundtrip', false, error instanceof Error ? error.message : 'Unknown diagnostic failure.');
  } finally {
    // Delete only the row this invocation created. A failed delete or
    // unverifiable cleanup must fail the entire diagnostic.
    if (insertedId) {
      try {
        const { error: deleteError } = await client
          .from('projects')
          .delete()
          .eq('id', insertedId)
          .eq('user_id', target.userId);
        if (deleteError) throw new Error('Test-row deletion failed.');
        const { data: leftover, error: verifyError } = await client
          .from('projects')
          .select('id')
          .eq('id', insertedId)
          .eq('user_id', target.userId)
          .maybeSingle();
        cleanupVerified = !verifyError && !leftover;
        record('api: cleanup isolated test row', cleanupVerified,
          cleanupVerified ? 'Confirmed deleted.' : 'Could not verify cleanup; manual recovery required.');
      } catch {
        cleanupVerified = false;
        record('api: cleanup isolated test row', false, 'Could not verify cleanup; manual recovery required.');
      }
    }
  }
  return passed && cleanupVerified;
}

async function runInteractiveBrowser(deploymentProof) {
  const expectedOrigin = deploymentProof.deploymentUrl;
  const EDITOR_URL = `${expectedOrigin}/editor`;
  const PROJECTS_URL = `${expectedOrigin}/projects`;
  console.log('\n[INTERACTIVE] Opening headed browser — complete Google sign-in, then wait for automation.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const projectName = `SaveReload Proof ${Date.now()}`;
  let monitorOrigin = false;
  let originPreserved = true;
  let stage = 'opening the attested editor';
  page.on('framenavigated', (frame) => {
    if (!monitorOrigin || frame !== page.mainFrame()) return;
    try {
      if (new URL(frame.url()).origin !== expectedOrigin) originPreserved = false;
    } catch {
      originPreserved = false;
    }
  });

  try {
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForURL('**/auth**', { timeout: 30_000 });

    stage = 'Google sign-in and return to the attested editor';
    await page.getByRole('button', { name: /continue with google/i }).click();
    await page.waitForURL((url) => url.origin === expectedOrigin && url.pathname === '/editor', { timeout: 180_000 });
    monitorOrigin = true;
    record('browser: Google sign-in → /editor',
      new URL(page.url()).origin === expectedOrigin && new URL(page.url()).pathname === '/editor',
      'Google sign-in returned to the attested editor origin.');

    await dismissEditorOverlays(page);

    stage = 'creating the sample project';
    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /new project/i }).click();
    await page.getByLabel('Project Name').fill(projectName);
    await page.getByRole('button', { name: /create project/i }).click();
    await page.getByTestId('editor-top-bar').waitFor({ state: 'visible', timeout: 30_000 });

    stage = 'loading the sample blueprint';
    await loadSampleProject(page);
    const before = await readStatusCounts(page);
    record(
      'browser: sample loaded',
      before.walls > 0,
      `Walls: ${before.walls}, Openings: ${before.openings}`,
    );

    stage = 'saving the project to the cloud';
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

    stage = 'refreshing and reopening the saved project';
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    record('browser: hard refresh', true, 'Browser reload completed.');

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

    stage = 'exporting and reading the JSON download';
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

    // Import must be exercised in the actual signed-in editor, not inferred
    // from a separate parser unit test or a service-role database roundtrip.
    // Establish an empty destination so an ignored import cannot reuse the
    // exported project's already matching counts and produce a false PASS.
    stage = 'creating the empty import target';
    await page.keyboard.press('Escape');
    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /new project/i }).click();
    const newProjectDialog = page.getByRole('dialog', { name: /create new project/i });
    await newProjectDialog.getByLabel('Project Name').fill(`${projectName} import`);
    await newProjectDialog.getByRole('button', { name: /^blank$/i }).click();
    await newProjectDialog.getByRole('button', { name: /create project/i }).click();
    await newProjectDialog.waitFor({ state: 'hidden', timeout: 30_000 });
    const emptyTarget = await waitForStatusCounts(page, { walls: 0, openings: 0 });
    record('browser: import target is empty',
      emptyTarget.walls === 0 && emptyTarget.openings === 0,
      `walls ${emptyTarget.walls}, openings ${emptyTarget.openings}`);

    stage = 'importing the exported JSON into the empty project';
    await openProjectActionsMenu(page);
    await page.getByRole('menuitem', { name: /import/i }).click();
    const importDialog = page.getByRole('dialog', { name: /import floor plan/i });
    await importDialog.waitFor({ state: 'visible', timeout: 10_000 });
    await importDialog.locator('input[type="file"]').setInputFiles({
      name: 'sire-roundtrip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportText, 'utf8'),
    });
    await importDialog.getByRole('button', { name: /apply import/i }).click();
    await importDialog.waitFor({ state: 'hidden', timeout: 10_000 });
    const importCounts = await waitForStatusCounts(page, {
      walls: before.walls,
      openings: before.openings,
    });
    const importMatch =
      importCounts.walls === before.walls && importCounts.openings === before.openings;
    record(
      'browser: import exported JSON counts',
      importMatch,
      `before ${before.walls}/${before.openings} → imported ${importCounts.walls}/${importCounts.openings}`,
    );

    originPreserved = originPreserved && new URL(page.url()).origin === expectedOrigin;
    record('browser: deployment origin preserved', originPreserved,
      originPreserved ? 'All post-sign-in document navigations stayed on the attested origin.' : 'Browser left the attested origin.');
    return before.walls > 0 && savedCloud && countsMatch && exportMatch && importMatch && originPreserved;
  } catch {
    record(
      'browser: save/reload flow',
      false,
      `Browser proof failed during ${stage}. Raw browser diagnostics are omitted to protect sign-in callback data.`,
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
2. Set PRODUCTION_URL to the immutable https://<8-hex-deployment>.vishvakarma-os.pages.dev origin.
   Securely provide CLOUDFLARE_API_TOKEN (Pages Read), CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_DEPLOYMENT_ID in the process environment.
   Keep credential values out of chat and logs. The default canonical URL is intentionally held.
   Canonical/branch aliases and direct uploads cannot currently produce trusted source proof.
3. Run: pnpm run verify:supabase-save-reload
4. Complete Google sign-in in the headed browser window; the OAuth redirect must return to that exact origin.
5. Wait for automation to finish (save → refresh → reload → export → empty project → import).
6. Re-run with --write-evidence after a green run to update launch evidence.

API-only diagnostic (does NOT count as browser release proof):
  SUPABASE_PROOF_USER_ID=<dedicated-test-uuid> pnpm run verify:supabase-save-reload -- --api-only --allow-live-test-data-write --write-evidence
`);
}

function writeEvidenceFiles(mode, pass, deploymentProof) {
  // The deployed source SHA comes from authenticated Cloudflare metadata,
  // never from stamping local HEAD onto a remote browser run.
  const sha = deploymentProof?.commitSha ?? null;
  const generatedAt = new Date().toISOString();
  const deploymentUrl = deploymentProof?.deploymentUrl ?? null;
  const operator = mode === 'interactive' ? 'interactive browser proof' : 'automated api roundtrip';
  const completeBrowserChecks = mode === 'interactive' && pass &&
    REQUIRED_BROWSER_SAVE_LOAD_CHECKS.every((name) =>
      results.some((result) => result.name === name && result.pass === true)
    );

  const runArtifact = {
    generatedAt,
    commitSha: sha,
    deploymentUrl,
    deploymentProof: deploymentProof ?? null,
    mode,
    operator,
    result: pass ? 'PASS' : 'FAIL',
    qualifies_as_release_browser_acceptance: completeBrowserChecks,
    release_authorized: false,
    checks: results,
  };
  const browserProofVerified = isVerifiedBrowserSaveLoadProof(runArtifact, {
    requestedUrl: BASE,
    expectedCommitSha: getCommitSha(),
    deploymentProof,
  });
  runArtifact.qualifies_as_release_browser_acceptance = browserProofVerified;
  writeFileSync(runArtifactPath, `${JSON.stringify(runArtifact, null, 2)}\n`);

  if (!browserProofVerified) {
    console.log('[HOLD] API-only, failed or incomplete browser evidence cannot upgrade the release document.');
    return;
  }

  const sample = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'samples', 'sample-house-01.json'), 'utf8'),
  );
  const wallCount = sample.walls?.length ?? 4;
  const openingCount = sample.openings?.length ?? 3;

  const saveLoadDoc = `# Save / Load Determinism Proof

Generated from commit: \`${sha}\`
Deployment URL: ${deploymentUrl}
Source attestation: authenticated Cloudflare Pages API, deployment \`${deploymentProof.deploymentId}\`.
Cloudflare Pages URL: ${CLOUDFLARE_PAGES_ORIGIN}
Generated at: ${generatedAt}
Operator: ${operator}
Result: \`PASS\`
Scope: signed-in browser save, reload, export and import **wall/opening counts** only.
Release authorized: **NO** — other security, device and exact-SHA gates remain required.

## Test Steps

| Step | Action | Measured evidence | Status |
|---|---|---|---|
| 1 | Sign in and open editor | Browser Google sign-in reached editor | PASS |
| 2 | Load sample | Browser status showed nonzero walls (${wallCount} in sample) | PASS |
| 3 | Save project | Actual cloud-save success toast, not local-only | PASS |
| 4 | Hard refresh and reopen | Browser reopened project; wall/opening counts matched | PASS |
| 5 | Export JSON | Actual download parsed; wall/opening counts matched | PASS |
| 6 | Import downloaded JSON | Actual file uploaded and applied; wall/opening counts matched | PASS |

## Compare wall/opening counts

The counts matched in the authenticated browser workflow. This does **not**
independently prove identical materials, metadata or full manifest hashing.

## Verdict

Browser workflow checks passed at ${deploymentUrl}; see the exact check records in
\`docs/release/evidence/save-load-proof-run.json\`.
This is **not** a release seal, physical-device test or cross-account RLS proof.
`;

  writeFileSync(join(evidenceDir, 'save-load-proof.md'), saveLoadDoc);
  console.log('[OK] Updated docs/release/evidence/save-load-proof.md');
  console.log(`[OK] Wrote ${runArtifactPath}`);
}

async function main() {
  if (skipInteractive && !apiOnly) {
    printRunbook();
    process.exit(0);
  }

  const env = { ...process.env, ...loadEnvLocal() };
  let pass = false;
  let mode = 'interactive';
  let deploymentProof;

  if (apiOnly) {
    mode = 'api-roundtrip';
    pass = await runApiRoundtrip(env);
  } else {
    try {
      deploymentProof = await attestCloudflareDeployment({
        requestedUrl: BASE,
        expectedCommitSha: getCommitSha(),
      });
      record('deployment: authenticated source provenance', true,
        'Cloudflare attests the requested immutable deployment at the exact local source SHA.');
      pass = await runInteractiveBrowser(deploymentProof);
      if (getCommitSha() !== deploymentProof.commitSha) {
        record('deployment: source SHA unchanged', false, 'Local Git HEAD changed during browser proof.');
        pass = false;
      }
    } catch (error) {
      record(deploymentProof ? 'browser: startup or teardown' : 'deployment: authenticated source provenance', false,
        deploymentProof ? 'Browser startup or teardown failed; check browser installation and display availability.' :
          error instanceof Error ? error.message : 'Deployment source attestation failed.');
    }
  }

  console.log('\n--- Summary ---');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} | ${r.name} | ${r.detail}`);
  }

  if (writeEvidence) {
    writeEvidenceFiles(mode, pass, deploymentProof);
  } else if (pass) {
    console.log('\n[INFO] Proof passed. Re-run with --write-evidence to update launch docs.');
  }

  if (!pass) {
    console.error(`\nFAILED: ${results.filter((r) => !r.pass).length}/${results.length} checks`);
    process.exit(1);
  }

  console.log(`\nALL CHECKS PASSED: ${results.length} (${mode})`);
}

main().catch(() => {
  console.error('[FAIL] Proof runner failed before completion; check local configuration and rerun.');
  process.exit(1);
});
