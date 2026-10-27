#!/usr/bin/env node
/**
 * S.I.R.E. LAW 105 Ω — metadata-only public CI evidence.
 *
 * NEVER reads file contents or follows symbolic links. No filenames, file paths,
 * captured page screenshots, HAR requests, Playwright traces, videos, environment
 * values or raw release receipts are copied into public GitHub artifacts.
 *
 * NOT a substitute for independently retained encrypted runtime evidence.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const EVIDENCE_ROOTS = Object.freeze([
  ['browser_report', 'playwright-report'],
  ['browser_tests', 'test-results'],
  ['release_files', 'docs/release/evidence'],
]);
const SHA40 = /^[0-9a-f]{40}$/;

function emptyStats() {
  return {
    files: 0,
    bytes: 0,
    max_file_bytes: 0,
    symlinks_skipped: 0,
    traces_or_archives: 0,
    videos: 0,
    screenshots_or_images: 0,
    text_or_json: 0,
    other: 0,
  };
}

function classifyExtension(ext) {
  if (['.zip', '.trace', '.har', '.gz', '.tgz', '.tar'].includes(ext)) return 'traces_or_archives';
  if (['.webm', '.mp4', '.mov', '.avi'].includes(ext)) return 'videos';
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) return 'screenshots_or_images';
  if (['.json', '.md', '.txt', '.log', '.html', '.xml', '.css', '.js'].includes(ext)) return 'text_or_json';
  return 'other';
}

function scanDirectory(directory, stats) {
  if (!existsSync(directory)) return;
  const start = lstatSync(directory);
  if (start.isSymbolicLink()) {
    stats.symlinks_skipped++;
    return;
  }
  if (!start.isDirectory()) throw new Error('Evidence input is not a directory');

  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      // lstat is intentionally used; never dereference symlinks in evidence.
      const stat = lstatSync(entryPath);
      if (stat.isSymbolicLink()) {
        stats.symlinks_skipped++;
      } else if (stat.isDirectory()) {
        stack.push(entryPath);
      } else if (stat.isFile()) {
        stats.files++;
        stats.bytes += stat.size;
        stats.max_file_bytes = Math.max(stats.max_file_bytes, stat.size);
        stats[classifyExtension(extname(entry.name).toLowerCase())]++;
      }
    }
  }
}

export function summarizeCiEvidence({ repository, exactSha, runId }) {
  if (!SHA40.test(exactSha ?? '')) throw new Error('An exact 40-character Git SHA is required');
  const root = resolve(repository);
  const inputs = {};
  for (const [label, relative] of EVIDENCE_ROOTS) {
    const data = emptyStats();
    scanDirectory(join(root, relative), data);
    inputs[label] = data;
  }
  return {
    schema: 'sire-ci-sanitized-evidence-v1',
    source_sha: exactSha,
    github_run_id: /^[0-9]+$/.test(String(runId ?? '')) ? String(runId) : null,
    kind: 'METADATA_ONLY_NOT_BROWSER_PROOF',
    directories: inputs,
    raw_file_names_paths_and_contents_included: false,
    network_credentials_included: false,
    screenshots_traces_videos_uploaded: false,
    qualifies_as_release_browser_acceptance: false,
    release_hold: 'Independent redacted or encrypted original runtime receipts required',
  };
}

export function writeCiEvidenceSummary({ repository, destination, exactSha, runId }) {
  const summary = summarizeCiEvidence({ repository, exactSha, runId });
  const dir = resolve(destination);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const pathname = join(dir, 'ci-evidence-counts.json');
  writeFileSync(pathname, JSON.stringify(summary, null, 2) + '\n', {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
  return summary;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000,
    }).trim();
    const summary = writeCiEvidenceSummary({
      repository: process.cwd(),
      destination: 'sire-sanitized-evidence',
      exactSha: sha,
      runId: process.env.GITHUB_RUN_ID,
    });
    // Safe counters only; never print path names, contents or raw test errors.
    console.log(JSON.stringify(summary));
  } catch {
    console.error('S.I.R.E. metadata-only evidence failed closed. No raw test artifacts will be uploaded.');
    process.exitCode = 1;
  }
}
