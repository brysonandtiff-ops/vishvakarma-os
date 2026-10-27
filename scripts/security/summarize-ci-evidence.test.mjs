import { describe, expect, it } from 'vitest';
import {
  mkdtempSync, mkdirSync, writeFileSync, symlinkSync,
  readFileSync, statSync, rmSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { summarizeCiEvidence, writeCiEvidenceSummary } from './summarize-ci-evidence.mjs';

const SHA = '0123456789abcdef0123456789abcdef01234567';

describe('S.I.R.E. LAW 105 Ω — public CI evidence is metadata-only', () => {
  it('counts evidence files but never includes secret bytes, filenames or source paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-redaction-'));
    const unsafeContent = 'BEARER-VERY-SENSITIVE-CREDENTIAL-DO-NOT-PUBLISH';
    const unsafeFilename = 'user-secret-credential-DO-NOT-PUBLISH.json';
    try {
      mkdirSync(join(root, 'playwright-report'), { recursive: true });
      mkdirSync(join(root, 'test-results', 'nested'), { recursive: true });
      mkdirSync(join(root, 'docs/release/evidence'), { recursive: true });
      writeFileSync(join(root, 'playwright-report', unsafeFilename), unsafeContent);
      writeFileSync(join(root, 'test-results', 'nested', 'raw-auth-request.trace.zip'), unsafeContent);
      writeFileSync(join(root, 'test-results', 'nested', 'private-page.webm'), unsafeContent);
      writeFileSync(join(root, 'docs/release/evidence', 'named-user.png'), unsafeContent);
      const summary = summarizeCiEvidence({ repository: root, exactSha: SHA, runId: '321' });
      expect(summary).toMatchObject({
        source_sha: SHA,
        github_run_id: '321',
        kind: 'METADATA_ONLY_NOT_BROWSER_PROOF',
        screenshots_traces_videos_uploaded: false,
        qualifies_as_release_browser_acceptance: false,
        directories: {
          browser_report: { files: 1, text_or_json: 1 },
          browser_tests: { files: 2, traces_or_archives: 1, videos: 1 },
          release_files: { files: 1, screenshots_or_images: 1 },
        },
      });
      const text = JSON.stringify(summary);
      for (const sensitive of [unsafeContent, unsafeFilename, root, 'named-user.png', 'raw-auth-request.trace.zip']) {
        expect(text).not.toContain(sensitive);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not follow symlinks into unrelated private files', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-symlinks-'));
    const external = mkdtempSync(join(tmpdir(), 'sire-external-'));
    try {
      mkdirSync(join(root, 'test-results'));
      writeFileSync(join(external, 'private-token'), 'DO_NOT_READ_THIS');
      symlinkSync(external, join(root, 'test-results', 'escape'), 'dir');
      const report = summarizeCiEvidence({ repository: root, exactSha: SHA });
      expect(report.directories.browser_tests.files).toBe(0);
      expect(report.directories.browser_tests.symlinks_skipped).toBe(1);
      expect(JSON.stringify(report)).not.toContain(external);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(external, { recursive: true, force: true });
    }
  });

  it('emits only an exclusive 0600 counts JSON, never a raw evidence file', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-public-summary-'));
    try {
      const destination = join(root, '.sire-sanitized-evidence');
      const report = writeCiEvidenceSummary({ repository: root, destination, exactSha: SHA, runId: '4' });
      const filename = join(destination, 'ci-evidence-counts.json');
      expect(existsSync(filename)).toBe(true);
      expect(statSync(filename).mode & 0o077).toBe(0);
      expect(JSON.parse(readFileSync(filename, 'utf8'))).toEqual(report);
      expect(() => writeCiEvidenceSummary({ repository: root, destination, exactSha: SHA })).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects non-SHA source inputs instead of inventing acceptance evidence', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-bad-sha-'));
    try {
      expect(() => summarizeCiEvidence({ repository: root, exactSha: 'not-verified' })).toThrow(/40-character/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
