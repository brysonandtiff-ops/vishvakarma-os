#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs, pass, fail, warn, info } from '../lib/cli.mjs';

const root = process.cwd();
const budgetPath = join(root, 'scripts', 'performance', 'lighthouse-budget.json');
const evidenceDir = join(root, 'docs', 'release', 'evidence');

function waitForUrl(url, timeoutMs = 120_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok || response.status < 500) {
          resolve(true);
          return;
        }
      } catch {
        // retry
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 1_000);
    };
    tick();
  });
}

function startPreview() {
  const child = spawn('pnpm', ['run', 'preview'], {
    cwd: root,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    detached: false,
  });
  return child;
}

async function runLighthouse(url, options) {
  const outputPath = join(evidenceDir, `lighthouse-${options.slug}.json`);
  const args = [
    url,
    '--quiet',
    '--chrome-flags=--headless --no-sandbox',
    '--only-categories=performance',
    '--output=json',
    `--output-path=${outputPath}`,
    `--form-factor=${options.formFactor}`,
    options.formFactor === 'mobile' ? '--screenEmulation.mobile' : '--preset=desktop',
  ];

  await new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'lighthouse', ...args], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`lighthouse exited ${code}`));
    });
  });

  const report = JSON.parse(await readFile(outputPath, 'utf8'));
  const audits = report.audits ?? {};
  return {
    slug: options.slug,
    url,
    outputPath,
    metrics: {
      lcp: audits['largest-contentful-paint']?.numericValue ?? null,
      cls: audits['cumulative-layout-shift']?.numericValue ?? null,
      tbt: audits['total-blocking-time']?.numericValue ?? null,
      score: report.categories?.performance?.score ?? null,
    },
  };
}

async function main() {
  const { options } = parseArgs();
  const budget = JSON.parse(await readFile(budgetPath, 'utf8'));
  const baseUrl = (options.url ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
  const isLocal = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');

  let previewProcess = null;
  if (isLocal) {
    info('Starting local preview server...');
    previewProcess = startPreview();
    await waitForUrl(baseUrl);
  }

  await mkdir(evidenceDir, { recursive: true });
  const results = [];
  const failures = [];

  try {
    for (const route of budget.routes) {
      for (const profile of budget.profiles) {
        const formFactor = profile === 'mobile' ? 'mobile' : 'desktop';
        const slug = `${route === '/' ? 'home' : route.slice(1)}-${profile}`.replace(/\//g, '-');
        const url = `${baseUrl}${route}`;
        info(`Lighthouse ${profile} → ${url}`);
        const result = await runLighthouse(url, { slug, formFactor });
        results.push(result);

        if (result.metrics.lcp != null && result.metrics.lcp > budget.thresholds['largest-contentful-paint']) {
          failures.push(`${slug} LCP ${result.metrics.lcp}ms > ${budget.thresholds['largest-contentful-paint']}ms`);
        }
        if (result.metrics.cls != null && result.metrics.cls > budget.thresholds['cumulative-layout-shift']) {
          failures.push(`${slug} CLS ${result.metrics.cls} > ${budget.thresholds['cumulative-layout-shift']}`);
        }
        if (result.metrics.tbt != null && result.metrics.tbt > budget.thresholds['total-blocking-time']) {
          failures.push(`${slug} TBT ${result.metrics.tbt}ms > ${budget.thresholds['total-blocking-time']}ms`);
        }
      }
    }
  } finally {
    if (previewProcess) previewProcess.kill('SIGTERM');
  }

  const summaryPath = join(evidenceDir, 'lighthouse-summary.json');
  await writeFile(
    summaryPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results, failures }, null, 2)}\n`,
    'utf8',
  );

  for (const result of results) {
    const score = result.metrics.score == null ? 'n/a' : Math.round(result.metrics.score * 100);
    console.log(`${result.slug}: score=${score} LCP=${result.metrics.lcp} CLS=${result.metrics.cls} TBT=${result.metrics.tbt}`);
  }

  if (failures.length > 0) {
    for (const failure of failures) warn('lighthouse', failure);
    fail('lighthouse', `${failures.length} threshold violation(s) — see ${summaryPath}`);
    process.exit(1);
  }

  pass('lighthouse', `reports in ${evidenceDir}`);
}

main().catch((error) => {
  fail('lighthouse', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
