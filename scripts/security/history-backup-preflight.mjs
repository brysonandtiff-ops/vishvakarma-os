#!/usr/bin/env node
/**
 * S.I.R.E. LAW 105 Ω — recovery bundle preflight.
 * NEVER uploads, publishes, rewrites, pushes or retains the credential-bearing bundle.
 * This is NOT an owner-controlled/offline encrypted backup, nor a release clearance.
 *
 * Requires: git, fully fetched refs, available temporary disk space.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 24 * 60 * 1000,
  }).trim();
}

function refTable(cwd) {
  return git(cwd, 'for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/remotes', 'refs/tags')
    .split('\n').filter(Boolean).sort();
}

export function exerciseEphemeralHistoryBackup({ repository, reportPath }) {
  const source = resolve(repository);
  if (git(source, 'rev-parse', '--is-inside-work-tree') !== 'true') {
    throw new Error('Expected a worktree repository');
  }

  const exactSourceSha = git(source, 'rev-parse', 'HEAD');
  const original = refTable(source);
  if (original.length === 0) throw new Error('No source refs; refusing unverifiable backup exercise');
  const originalCommits = Number(git(source, 'rev-list', '--all', '--count'));
  const originalObjects = Number(git(source, 'count-objects', '-v').split('\n')
    .find((value) => value.startsWith('in-pack:'))?.split(':')[1].trim() ?? 0);
  const tempDir = mkdtempSync(join(tmpdir(), 'sire-history-recovery-'));
  const bundle = join(tempDir, 'UNSAFE-SECRETS-EPHEMERAL.bundle');
  const restore = join(tempDir, 'restored-mirror.git');
  let validated = false;
  let sizeBytes = 0;

  try {
    git(source, 'bundle', 'create', bundle, '--all');
    if (!existsSync(bundle)) throw new Error('Git bundle not created');
    sizeBytes = statSync(bundle).size;
    if (sizeBytes <= 0) throw new Error('Empty Git bundle');
    // Git verifies format and object prerequisites; suppress ref listings.
    git(source, 'bundle', 'verify', bundle);

    execFileSync('git', ['clone', '--mirror', '--quiet', bundle, restore], {
      cwd: tempDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 24 * 60 * 1000,
    });

    if (git(restore, 'rev-parse', '--is-bare-repository') !== 'true') {
      throw new Error('Restored repository is not a mirror');
    }
    const roundtripped = refTable(restore);
    if (original.length !== roundtripped.length ||
      original.some((entry, i) => entry !== roundtripped[i])) {
      throw new Error('Restored refs and commit OIDs do not exactly match the source');
    }
    const restoredCommits = Number(git(restore, 'rev-list', '--all', '--count'));
    if (restoredCommits !== originalCommits) {
      throw new Error('Restored reachable commit count does not match');
    }
    // Integrity verification remains silent; failure is a hard error.
    git(restore, 'fsck', '--full', '--no-reflogs', '--no-progress');
    validated = true;
  } finally {
    // Bundle and mirror both contain any historical secrets. Never upload them.
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 3 });
  }

  const report = {
    result: validated ? 'EPHEMERAL_ROUNDTRIP_VERIFIED' : 'FAILED',
    source_commit: exactSourceSha,
    reference_count: original.length,
    reachable_commit_count: originalCommits,
    source_packed_object_count: originalObjects,
    transient_bundle_bytes: sizeBytes,
    exact_ref_tip_comparison: validated,
    restored_commit_count_equal: validated,
    mirror_fsck_passed: validated,
    sensitive_backup_retained: false,
    history_rewritten: false,
    credentials_rotated: false,
    does_not_prove: [
      'An owner-controlled encrypted offline backup exists',
      'All GitHub pull request refs, forks, caches, and unreachable objects were captured',
      'Any exposed provider credential is revoked',
      'History is safe to force push',
    ],
  };
  if (reportPath) writeFileSync(resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const repository = process.env.SIRE_BACKUP_SOURCE || process.cwd();
  const reportPath = process.env.SIRE_BACKUP_REPORT || '';
  try {
    const result = exerciseEphemeralHistoryBackup({ repository, reportPath });
    // Emit counters only; never include refs, filenames, Git objects or token values.
    console.log(JSON.stringify(result, null, 2));
  } catch {
    console.error('S.I.R.E. history backup preflight FAILED; no bundle uploaded or retained.');
    process.exitCode = 1;
  }
}
