import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exerciseEphemeralHistoryBackup } from './history-backup-preflight.mjs';

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

describe('S.I.R.E. source-history backup preflight (never persists secret-bearing bundle)', () => {
  it('builds, clones, checks all branch/tag tips, and verifies object integrity without an artifact', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-history-test-'));
    const reportPath = join(root, 'safe-report.json');
    try {
      git(root, 'init', '--quiet', '--initial-branch=main');
      git(root, 'config', 'user.email', 'recovery-test@example.invalid');
      git(root, 'config', 'user.name', 'Recovery Test');
      writeFileSync(join(root, 'sample.txt'), 'synthetic fixture only\n');
      git(root, 'add', 'sample.txt');
      git(root, 'commit', '--quiet', '-m', 'initial safe fixture');
      git(root, 'branch', 'integration');
      git(root, 'tag', 'sample-tag');
      git(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
      writeFileSync(join(root, 'sample.txt'), 'second fixture revision\n');
      git(root, 'commit', '--quiet', '-am', 'second fixture revision');

      const result = exerciseEphemeralHistoryBackup({ repository: root, reportPath });
      expect(result).toMatchObject({
        result: 'EPHEMERAL_ROUNDTRIP_VERIFIED',
        reference_count: 4,
        reachable_commit_count: 2,
        exact_ref_tip_comparison: true,
        restored_commit_count_equal: true,
        mirror_fsck_passed: true,
        sensitive_backup_retained: false,
        history_rewritten: false,
        credentials_rotated: false,
      });
      expect(result.transient_bundle_bytes).toBeGreaterThan(0);
      expect(JSON.parse(readFileSync(reportPath, 'utf8'))).toEqual(result);
      expect(readFileSync(reportPath, 'utf8')).not.toContain('synthetic fixture only');
      expect(git(root, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main');
      expect(git(root, 'status', '--porcelain')).toBe('?? safe-report.json');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails without a valid source repository, producing no misleading success receipt', () => {
    const root = mkdtempSync(join(tmpdir(), 'sire-history-invalid-'));
    try {
      expect(() => exerciseEphemeralHistoryBackup({ repository: root })).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
