#!/usr/bin/env node
/**
 * S.I.R.E. LAW 105 Ω — independent, owner-side recovery of an age-encrypted
 * Git bundle. Decrypted material MUST reside on a verified RAM-backed tmpfs.
 *
 * This is a non-destructive restore rehearsal, never a force-push permission.
 * No private key, path, ref names, file content or decrypted archive is logged.
 */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync, createReadStream, existsSync, fstatSync, lstatSync, mkdtempSync,
  openSync, readFileSync, realpathSync, rmSync, statfsSync, statSync,
} from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const TMPFS_MAGIC = 0x01021994;
const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', timeout: 25 * 60 * 1000,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
function refs(cwd) {
  return git(cwd, 'for-each-ref', '--format=%(refname) %(objectname)',
    'refs/heads', 'refs/remotes', 'refs/tags').split('\n').filter(Boolean).sort();
}
function assertPrivateRegularFile(path) {
  if (!isAbsolute(path ?? '')) throw new Error('Expected absolute owner-controlled file path');
  const st = lstatSync(path);
  if (!st.isFile() || (st.mode & 0o077) !== 0) {
    throw new Error('Input must be a private regular file with no group/other permissions');
  }
  if (typeof process.getuid === 'function' && st.uid !== process.getuid()) {
    throw new Error('Input must be owned by the verifying user');
  }
}
function verifyRecoveryInputs({ repository, encryptedArchive, identityFile, receipt, ramRoot }) {
  if (!repository || !encryptedArchive || !identityFile || !ramRoot) {
    throw new Error('Repository, encrypted archive, owner identity and RAM root are required');
  }
  const repo = realpathSync(repository);
  if (!isAbsolute(encryptedArchive) || !isAbsolute(identityFile)) {
    throw new Error('Encrypted archive and identity paths must be absolute');
  }
  const archive = resolve(encryptedArchive), identity = resolve(identityFile);
  for (const path of [archive, identity]) {
    if (path === repo || path.startsWith(repo + sep)) {
      throw new Error('Private recovery inputs must be outside the Git repository');
    }
    assertPrivateRegularFile(path);
  }
  if (!isAbsolute(ramRoot)) throw new Error('RAM-backed root must be absolute');
  const ram = resolve(ramRoot);
  if (!lstatSync(ram).isDirectory() || statfsSync(ram).type !== TMPFS_MAGIC) {
    throw new Error('Refusing decrypted archive on persistent or symlinked storage; tmpfs required');
  }
  if (!receipt || receipt.result !== 'ENCRYPTED_COPY_CREATED_UNVERIFIED' ||
      receipt.plaintext_bundle_written_to_disk !== false ||
      receipt.encrypted_backup_retained !== true ||
      !SHA.test(receipt.source_sha ?? '') ||
      !SHA256.test(receipt.encrypted_sha256 ?? '') ||
      !Number.isSafeInteger(receipt.git_ref_count) || receipt.git_ref_count < 1 ||
      !Number.isSafeInteger(receipt.encrypted_bytes) || receipt.encrypted_bytes < 100) {
    throw new Error('Missing or invalid original encrypted-backup creation receipt');
  }
  return { repo, archive, identity, ram };
}
function exitOk(proc, name) {
  return new Promise((res, rej) => {
    proc.once('error', () => rej(new Error(name + ' could not start')));
    proc.once('close', (code) => code === 0 ? res() : rej(new Error(name + ' failed')));
  });
}
async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function verifyEncryptedHistoryBackup({
  repository, encryptedArchive, identityFile, receipt,
  ramRoot = '/dev/shm', ageBinary = 'age',
}) {
  const { repo, archive, identity, ram } = verifyRecoveryInputs({
    repository, encryptedArchive, identityFile, receipt, ramRoot,
  });
  const sourceSha = git(repo, 'rev-parse', 'HEAD');
  if (sourceSha !== receipt.source_sha) {
    throw new Error('Current repository HEAD no longer matches the original backup receipt');
  }
  const originalRefs = refs(repo);
  if (originalRefs.length !== receipt.git_ref_count) {
    throw new Error('Current repository ref count differs from the encrypted-backup receipt');
  }
  const originalCommits = Number(git(repo, 'rev-list', '--all', '--count'));
  if (statSync(archive).size !== receipt.encrypted_bytes ||
      await hashFile(archive) !== receipt.encrypted_sha256) {
    throw new Error('Encrypted archive does not match receipt size and SHA256');
  }
  execFileSync(ageBinary, ['--version'], {
    cwd: repo, stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000,
  });

  const temp = mkdtempSync(join(ram, 'sire-private-restore-'));
  const bundle = join(temp, 'sensitive-plaintext-in-ram.bundle');
  const mirror = join(temp, 'restored.git');
  let outputFd;
  try {
    outputFd = openSync(bundle, 'wx', 0o600);
    const proc = spawn(ageBinary, ['-d', '-i', identity, archive], {
      cwd: repo, stdio: ['ignore', outputFd, 'ignore'],
    });
    await exitOk(proc, 'Private-key decryption');
    closeSync(outputFd);
    outputFd = undefined;

    const st = lstatSync(bundle);
    if (!st.isFile() || st.size < 100 || (st.mode & 0o077) !== 0 ||
        statfsSync(bundle).type !== TMPFS_MAGIC) {
      throw new Error('Decrypted bundle is not a private regular file on tmpfs');
    }
    git(repo, 'bundle', 'verify', bundle);
    execFileSync('git', ['clone', '--mirror', '--quiet', bundle, mirror], {
      cwd: temp, stdio: ['ignore', 'pipe', 'pipe'], timeout: 25 * 60 * 1000,
    });
    const restoredRefs = refs(mirror);
    if (originalRefs.length !== restoredRefs.length ||
        originalRefs.some((x, i) => x !== restoredRefs[i])) {
      throw new Error('Mirror ref/OID list does not exactly match the source repository');
    }
    const restoredCommits = Number(git(mirror, 'rev-list', '--all', '--count'));
    if (restoredCommits !== originalCommits) throw new Error('Mirror commit count differs');
    git(mirror, 'fsck', '--full', '--no-reflogs', '--no-progress');
    return {
      result: 'OWNER_BACKUP_RESTORE_VERIFIED_FOR_UNCHANGED_SOURCE',
      exact_source_sha: sourceSha,
      ref_count: originalRefs.length,
      reachable_commit_count: originalCommits,
      encrypted_sha256_verified: true,
      private_key_decryption_verified: true,
      exact_ref_oid_match: true,
      mirror_fsck_verified: true,
      plaintext_persistent_disk_copy_created: false,
      temporary_plaintext_deleted: true,
      credentials_rotated: false,
      history_rewritten: false,
      release_authorized: false,
      scope_limit: 'Only refs present in both the creation receipt and current unchanged repository. No external forks/caches or provider revocation proven.',
    };
  } finally {
    if (outputFd !== undefined) {
      try { closeSync(outputFd); } catch { /* already closed */ }
    }
    rmSync(temp, { recursive: true, force: true, maxRetries: 3 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.env.CI) {
    console.error('REFUSED: owner-controlled decryption is prohibited in CI.');
    process.exitCode = 1;
  } else {
    try {
      const receiptPath = process.env.SIRE_BACKUP_RECEIPT_PATH ?? '';
      assertPrivateRegularFile(receiptPath);
      const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
      const result = await verifyEncryptedHistoryBackup({
        repository: process.env.SIRE_BACKUP_SOURCE ?? process.cwd(),
        encryptedArchive: process.env.SIRE_ENCRYPTED_BACKUP_DEST,
        identityFile: process.env.SIRE_AGE_IDENTITY_PATH,
        ramRoot: process.env.SIRE_PRIVATE_RAM_ROOT ?? '/dev/shm',
        receipt,
      });
      console.log(JSON.stringify(result, null, 2));
    } catch {
      console.error('FAILED or REFUSED: private age identity, unchanged refs, verified receipt and RAM-backed restore are required.');
      process.exitCode = 1;
    }
  }
}
