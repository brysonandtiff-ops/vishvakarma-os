#!/usr/bin/env node

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const teamId = 'team_cNWlNxzn9b9GNQhKf6cmUdfJ';
const teamSlug = 'tyrasic-creations';
const projectId = 'prj_Hkp9ttkSAnmAGk5ZISG7pnEj3HrF';
const projectSlug = 'vishvakarma-os';
const repositoryName = 'playwright-cert';
const imageTag = 'v1.60.0-noble';
const sourceImage = `mcr.microsoft.com/playwright:${imageTag}`;
const destinationImage = `vcr.vercel.com/${teamSlug}/${projectSlug}/${repositoryName}:${imageTag}`;
const craneVersion = 'v0.20.3';
const provisionerName = `vish-image-provisioner-${Date.now()}`;
const browserProbeName = `vish-browser-probe-${Date.now()}`;
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const localTokenPath = '/tmp/vish-vercel-oidc-token';

function sandboxArgs(args) {
  return ['dlx', 'sandbox', ...args];
}

function run(args, { allowFailure = false, timeoutMs = 20 * 60_000 } = {}) {
  const printable = ['pnpm', ...args].join(' ');
  console.log(`[sandbox-probe] ${printable}`);
  const result = spawnSync('pnpm', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VERCEL_TOKEN: oidcToken ?? '',
      VERCEL_TEAM_ID: teamId,
      VERCEL_PROJECT_ID: projectId,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}: ${printable}`);
  }
  return result;
}

async function ensureVcrRepository() {
  const response = await fetch(
    `https://api.vercel.com/v1/vcr/repository?teamId=${encodeURIComponent(teamId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, name: repositoryName }),
    },
  );
  const body = await response.text();
  if (response.ok || response.status === 409 || /already exists/i.test(body)) {
    console.log(`[sandbox-probe] VCR repository ready: ${repositoryName}`);
    return;
  }
  throw new Error(`VCR repository request failed (${response.status}): ${body.slice(0, 500)}`);
}

async function writeArtifact(status) {
  await mkdir('dist', { recursive: true });
  await writeFile(
    'dist/index.html',
    `<!doctype html><html><body><h1>Vishvakarma.OS Browser Sandbox Probe</h1><pre>${status}</pre></body></html>`,
    'utf8',
  );
}

function stopAndRemove(name) {
  run(sandboxArgs(['stop', name]), { allowFailure: true, timeoutMs: 120_000 });
  run(sandboxArgs(['remove', name]), { allowFailure: true, timeoutMs: 120_000 });
}

async function main() {
  console.log(`[sandbox-probe] Vercel OIDC credential: ${oidcToken ? 'configured' : 'not configured'}`);
  if (!oidcToken) throw new Error('VERCEL_OIDC_TOKEN is unavailable.');

  await ensureVcrRepository();
  await writeFile(localTokenPath, oidcToken, { mode: 0o600 });

  let provisionerCreated = false;
  let browserProbeCreated = false;
  try {
    run(sandboxArgs(['create', '--name', provisionerName, '--runtime', 'node24', '--timeout', '30m', '--vcpus', '4']));
    provisionerCreated = true;
    run(sandboxArgs(['copy', localTokenPath, `${provisionerName}:/tmp/vercel-oidc-token`]));

    const installCrane = [
      'set -euo pipefail',
      `curl -fsSL https://github.com/google/go-containerregistry/releases/download/${craneVersion}/go-containerregistry_Linux_x86_64.tar.gz -o /tmp/crane.tgz`,
      "tar -xzf /tmp/crane.tgz -C /usr/local/bin crane",
      'chmod 0755 /usr/local/bin/crane',
      'crane version',
    ].join('; ');
    run(
      sandboxArgs(['exec', '--sudo', '--timeout', '5m', provisionerName, '--', 'bash', '-lc', installCrane]),
      { timeoutMs: 7 * 60_000 },
    );
    run(
      sandboxArgs([
        'exec',
        '--sudo',
        '--timeout',
        '5m',
        provisionerName,
        '--',
        'bash',
        '-lc',
        "cat /tmp/vercel-oidc-token | crane auth login vcr.vercel.com --username oidc --password-stdin",
      ]),
    );
    run(
      sandboxArgs([
        'exec',
        '--sudo',
        '--timeout',
        '20m',
        provisionerName,
        '--',
        'crane',
        'copy',
        sourceImage,
        destinationImage,
      ]),
      { timeoutMs: 25 * 60_000 },
    );
    stopAndRemove(provisionerName);
    provisionerCreated = false;

    run(
      sandboxArgs([
        'create',
        '--name',
        browserProbeName,
        '--image',
        `${repositoryName}:${imageTag}`,
        '--timeout',
        '15m',
        '--vcpus',
        '4',
      ]),
    );
    browserProbeCreated = true;
    run(sandboxArgs(['exec', browserProbeName, '--', 'node', '--version']));

    const browserSmoke = [
      'set -euo pipefail',
      'npm init -y >/dev/null',
      'npm install playwright@1.60.0 --no-save >/dev/null',
      "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright node -e \"const { chromium, firefox, webkit } = require('playwright'); (async()=>{ for (const [name,type] of Object.entries({chromium,firefox,webkit})) { const browser = await type.launch({headless:true}); const page = await browser.newPage(); await page.setContent('<title>Vish Browser Probe</title><h1>PASS</h1>'); console.log(name + ':' + await page.title()); await browser.close(); } })().catch(error=>{ console.error(error); process.exit(1); });\"",
    ].join('; ');
    run(
      sandboxArgs(['exec', '--timeout', '10m', '--workdir', '/tmp', browserProbeName, '--', 'bash', '-lc', browserSmoke]),
      { timeoutMs: 12 * 60_000 },
    );

    await writeArtifact(
      `PASS: ${destinationImage} mirrored to VCR; Chromium, Firefox, and WebKit launched successfully.`,
    );
    console.log('[sandbox-probe] PASS — browser-ready custom image and all three engines verified.');
  } finally {
    if (browserProbeCreated) stopAndRemove(browserProbeName);
    if (provisionerCreated) stopAndRemove(provisionerName);
    await rm(localTokenPath, { force: true });
  }
}

main().catch(async (error) => {
  console.error('[sandbox-probe] FAIL:', error instanceof Error ? error.message : String(error));
  await writeArtifact(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  await rm(localTokenPath, { force: true });
  process.exit(1);
});
