#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const evidenceDir = resolve(repoRoot, 'evidence/device-tests');
const finalMode = process.argv.includes('--final');

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function collectTests(suites, inherited = [], output = []) {
  for (const suite of suites ?? []) {
    const suiteTitles = suite.title ? [...inherited, suite.title] : inherited;
    for (const spec of suite.specs ?? []) {
      for (const testCase of spec.tests ?? []) {
        const results = testCase.results ?? [];
        const finalResult = results.at(-1) ?? {};
        output.push({
          project: testCase.projectName ?? testCase.projectId ?? 'unknown',
          title: [...suiteTitles, spec.title ?? '', testCase.title ?? ''].filter(Boolean).join(' › '),
          expectedStatus: testCase.expectedStatus ?? 'passed',
          status: finalResult.status ?? testCase.status ?? 'unknown',
          duration: Number(finalResult.duration ?? 0),
          error: finalResult.error?.message ?? finalResult.errors?.[0]?.message ?? '',
        });
      }
    }
    collectTests(suite.suites, suiteTitles, output);
  }
  return output;
}

async function countScreenshots(path) {
  let count = 0;
  try {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) count += await countScreenshots(child);
      else if (extname(entry.name).toLowerCase() === '.png') count += 1;
    }
  } catch {
    return 0;
  }
  return count;
}

function normalizeStatus(test) {
  if (test.expectedStatus === 'skipped' || test.status === 'skipped') return 'skipped';
  if (test.status === 'passed') return 'passed';
  if (test.status === 'timedOut' || test.status === 'failed' || test.status === 'interrupted') return 'failed';
  return 'other';
}

function severityFor(test) {
  const title = test.title.toLowerCase();
  if (/new-user editor truth|pwa shell truth/.test(title)) return 'P1';
  if (/route truth|rotation truth/.test(title)) return 'P2';
  return 'P3';
}

function browserFromProject(project) {
  if (/webkit/i.test(project)) return 'WebKit';
  if (/firefox/i.test(project)) return 'Firefox';
  if (/chromium/i.test(project)) return 'Chromium';
  return 'Unknown';
}

function deviceClassFromProject(project) {
  if (/iphone|android-phone/i.test(project)) return 'Phone';
  if (/ipad|android-tablet/i.test(project)) return 'Tablet';
  if (/hybrid/i.test(project)) return 'Hybrid';
  return 'Desktop';
}

function scoreRow(project, tests) {
  const counts = { passed: 0, failed: 0, skipped: 0, other: 0 };
  for (const test of tests) counts[normalizeStatus(test)] += 1;
  const denominator = counts.passed + counts.failed;
  const score = denominator === 0 ? 0 : Math.round((counts.passed / denominator) * 100);
  const result = counts.failed === 0 ? '✅ PASS' : counts.passed === 0 ? '❌ FAIL' : '🟠 DEGRADED';
  return { project, ...counts, score, result };
}

const resultsJson = await readJson(resolve(evidenceDir, 'results.json'), { suites: [] });
const metadata = await readJson(resolve(evidenceDir, 'run-metadata.json'), {});
const tests = collectTests(resultsJson.suites ?? []);
const projectNames = [...new Set(tests.map((test) => test.project))].sort();
const rows = projectNames.map((project) => scoreRow(project, tests.filter((test) => test.project === project)));
const failures = tests.filter((test) => normalizeStatus(test) === 'failed');
const severityCounts = failures.reduce(
  (counts, test) => {
    counts[severityFor(test)] += 1;
    return counts;
  },
  { P0: 0, P1: 0, P2: 0, P3: 0 },
);
const screenshotCount = await countScreenshots(resolve(evidenceDir, 'screenshots'));
const browserNames = [...new Set(projectNames.map(browserFromProject))].filter((name) => name !== 'Unknown');
const totalPassed = tests.filter((test) => normalizeStatus(test) === 'passed').length;
const totalSkipped = tests.filter((test) => normalizeStatus(test) === 'skipped').length;
const totalFailed = failures.length;
const best = [...rows].sort((a, b) => b.score - a.score)[0];
const worst = [...rows].sort((a, b) => a.score - b.score)[0];
const reportName = finalMode ? 'VISHVAKARMA_MULTI_DEVICE_TRUTH_REPORT.md' : 'MULTI_DEVICE_BASELINE_REPORT.md';

const lines = [];
lines.push(`# ${finalMode ? 'Vishvakarma.OS Multi-Device Truth Report' : 'Vishvakarma.OS Multi-Device Baseline Report'}`);
lines.push('');
lines.push(`**Generated:** ${new Date().toISOString()}`);
lines.push(`**Repository:** ${metadata.repository ?? 'UNKNOWN'}`);
lines.push(`**Local root:** ${metadata.localRoot ?? 'UNKNOWN'}`);
lines.push(`**Branch:** ${metadata.branch ?? 'UNKNOWN'}`);
lines.push(`**Git SHA:** ${metadata.head ?? 'UNKNOWN'}`);
lines.push(`**Worktree:** ${metadata.worktreeStatus ?? 'UNKNOWN'}`);
lines.push(`**Evidence classification:** EMULATED DEVICE / BROWSER ENGINE AUTOMATION`);
lines.push('');
lines.push('> This automated run must never be described as physical iPhone, iPad, Android, Surface, or macOS hardware proof. Real-device results belong in the manual evidence section and must name the physical hardware, OS and browser version actually used.');
lines.push('');
lines.push('## Executive scorecard');
lines.push('');
lines.push('| Device profile | Class | Browser engine | Pass | Fail | Skip | Score | Result |');
lines.push('|---|---|---|---:|---:|---:|---:|---|');
for (const row of rows) {
  lines.push(`| ${row.project} | ${deviceClassFromProject(row.project)} | ${browserFromProject(row.project)} | ${row.passed} | ${row.failed} | ${row.skipped} | ${row.score}/100 | ${row.result} |`);
}
lines.push('');
lines.push('## Required truth totals');
lines.push('');
lines.push(`- **TOTAL DEVICE PROFILES TESTED:** ${projectNames.length}`);
lines.push(`- **REAL DEVICES TESTED BY THIS AUTOMATION:** 0`);
lines.push(`- **EMULATED DEVICE PROFILES TESTED:** ${projectNames.length}`);
lines.push(`- **BROWSER ENGINES TESTED:** ${browserNames.join(', ') || 'NONE'}`);
lines.push(`- **AUTOMATED CHECKS EXECUTED:** ${tests.length}`);
lines.push(`- **SCREENSHOTS CAPTURED:** ${screenshotCount}`);
lines.push(`- **PASS COUNT:** ${totalPassed}`);
lines.push(`- **FAIL COUNT:** ${totalFailed}`);
lines.push(`- **SKIPPED COUNT:** ${totalSkipped}`);
lines.push(`- **P0 COUNT:** ${severityCounts.P0}`);
lines.push(`- **P1 COUNT:** ${severityCounts.P1}`);
lines.push(`- **P2 COUNT:** ${severityCounts.P2}`);
lines.push(`- **P3 COUNT:** ${severityCounts.P3}`);
lines.push('');
lines.push('## Experience extremes');
lines.push('');
lines.push(`- **BEST EMULATED EXPERIENCE:** ${best ? `${best.project} (${best.score}/100)` : 'NOT MEASURED'}`);
lines.push(`- **WORST EMULATED EXPERIENCE:** ${worst ? `${worst.project} (${worst.score}/100)` : 'NOT MEASURED'}`);
lines.push('- **MOST IMPORTANT REAL-DEVICE BUG:** NOT MEASURED until physical-device testing is performed.');
lines.push('- **MOST IMPORTANT PERFORMANCE ISSUE:** NOT MEASURED by this functional matrix unless a failing check records it.');
lines.push('- **MOST IMPORTANT ACCESSIBILITY ISSUE:** Review failing device/accessibility checks plus the dedicated accessibility audit.');
lines.push('');
lines.push('## Automated failures');
lines.push('');
if (failures.length === 0) {
  lines.push('No automated failures were reported.');
} else {
  lines.push('| Severity | Device profile | Test | Error |');
  lines.push('|---|---|---|---|');
  for (const failure of failures) {
    const error = String(failure.error || 'See Playwright trace/report').replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 320);
    lines.push(`| ${severityFor(failure)} | ${failure.project} | ${failure.title.replace(/\|/g, '\\|')} | ${error} |`);
  }
}
lines.push('');
lines.push('## Readiness verdict');
lines.push('');
const classVerdict = (pattern) => {
  const matching = rows.filter((row) => pattern.test(row.project));
  if (matching.length === 0) return 'NOT TESTED';
  if (matching.every((row) => row.failed === 0)) return 'CONDITIONAL — automated emulation passed; physical-device proof still required';
  return 'NO — automated failures remain';
};
lines.push(`- **DESKTOP READY:** ${classVerdict(/desktop|hybrid/i)}`);
lines.push(`- **PHONE READY:** ${classVerdict(/iphone|android-phone/i)}`);
lines.push(`- **IPAD READY:** ${classVerdict(/ipad/i)}`);
lines.push(`- **ANDROID TABLET READY:** ${classVerdict(/android-tablet/i)}`);
lines.push(`- **PWA READY:** ${failures.some((failure) => /pwa shell truth/i.test(failure.title)) ? 'NO — PWA shell check failed' : 'CONDITIONAL — manifest automation passed; install/standalone/offline require real-device confirmation'}`);
lines.push(`- **PRODUCTION MULTI-DEVICE READY:** ${totalFailed === 0 ? 'CONDITIONAL — automated matrix is green, real-device proof remains mandatory' : 'NO — automated failures remain'}`);
lines.push('');
lines.push('## Physical-device evidence — manual completion required');
lines.push('');
lines.push('| Physical device | OS | Browser/version | Portrait | Landscape | Editor | 3D | Export | PWA | Result | Evidence path |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
lines.push('| iPhone | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('| Android phone | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('| iPad 11-inch | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('| iPad 13-inch | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('| Android tablet | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('| Touch hybrid | — | — | — | — | — | — | — | — | NOT TESTED | — |');
lines.push('');
lines.push('## Final evidence checklist');
lines.push('');
lines.push('- [ ] Physical-device model, OS and browser version recorded for every claimed real-device pass.');
lines.push('- [ ] Screenshots/video linked for real-device editor, 3D, export and rotation proof.');
lines.push('- [ ] Console/network failures reviewed.');
lines.push('- [ ] `git diff --check` recorded after any repairs.');
lines.push('- [ ] TypeScript/lint/unit/build/E2E results recorded after repairs.');
lines.push('- [ ] Failed baseline cases re-run after fixes.');
lines.push('- [ ] Full critical flow re-run after fixes.');
lines.push('');
lines.push('## Human-review questions');
lines.push('');
lines.push('Record a first-time-user answer for: first impression, ease of learning, 2D editor, 3D, phone, iPad, desktop, navigation, visual design, speed, frustrations, confusing features, favourite feature, trust/professionalism, whether an architect would keep using it, what would make them stop, and an overall /100 score.');
lines.push('');

await writeFile(resolve(evidenceDir, reportName), `${lines.join('\n')}\n`, 'utf8');
console.log(`Truth report written: evidence/device-tests/${reportName}`);
