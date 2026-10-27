#!/usr/bin/env node
/**
 * S.I.R.E. LAW 105 Ω — owner-controlled encrypted history backup.
 *
 * This operator-side command NEVER runs automatically during a release,
 * and NEVER writes the unencrypted Git bundle to disk.
 * It streams 'git bundle create - --all' directly through age (X25519 recipient).
 * An offline owner-controlled identity and an independent restore test are
 * mandatory before anyone considers a history rewrite.
 */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync, createReadStream, existsSync, fstatSync, fsyncSync, lstatSync, openSync, realpathSync,
  statSync, unlinkSync,
} from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

function command(cwd, program, ...args) {
  return execFileSync(program, args, {
    cwd, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function waitForExit(proc, description) {
  return new Promise((accept, reject) => {
    proc.once('error', () => reject(new Error(`${description} failed to launch`)));
    proc.once('close', (code) => code === 0
      ? accept()
      : reject(new Error(`${description} exited unsuccessfully`)));
  });
}

export function validateEncryptedBackupDestination({ repository, destination, recipient }) {
  if (!/^age1[0-9a-z]{40,80}$/.test(recipient ?? '')) {
    throw new Error('An age X25519 public recipient (age1...) is required');
  }
  if (!isAbsolute(destination ?? '')) {
    throw new Error('Backup destination must be an absolute path outside the Git checkout');
  }
  const repo = realpathSync(repository);
  const output = resolve(destination);
  const dir = realpathSync(resolve(output, '..'));
  if (dir === repo || dir.startsWith(repo + sep)) {
    throw new Error('Encrypted backup must not be stored inside the Git repository');
  }
  if ((statSync(dir).mode & 0o077) !== 0) {
    throw new Error('Backup destination directory must be private to its owner (mode 0700)');
  }
  if (existsSync(output)) {
    throw new Error('Refusing to overwrite an existing encrypted backup');
  }
  return { repo, output };
}

export async function createEncryptedHistoryBackup({
  repository,
  destination,
  recipient,
  ageBinary = 'age',
}) {
  const { repo, output } = validateEncryptedBackupDestination({
    repository, destination, recipient,
  });
  // Validate both tools and source *before* opening a backup path.
  const sourceSha = command(repo, 'git', 'rev-parse', 'HEAD');
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('Git HEAD is not an exact 40-character SHA');
  const referenceCount = command(repo, 'git', 'for-each-ref',
    '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/tags')
    .split('\n').filter(Boolean).length;
  if (referenceCount === 0) throw new Error('No Git references to preserve');
  command(repo, ageBinary, '--version');

  let fd;
  let createdFileIdentity = null;
  let sourceProcess;
  let encryptionProcess;
  try {
    fd = openSync(output, 'wx', 0o600);
    const fileStat = fstatSync(fd);
    createdFileIdentity = { dev: fileStat.dev, ino: fileStat.ino };
    sourceProcess = spawn('git', ['bundle', 'create', '-', '--all'], {
      cwd: repo, stdio: ['ignore', 'pipe', 'ignore'],
    });
    encryptionProcess = spawn(ageBinary, ['-r', recipient], {
      cwd: repo, stdio: ['pipe', fd, 'ignore'],
    });
    const results = await Promise.allSettled([
      pipeline(sourceProcess.stdout, encryptionProcess.stdin),
      waitForExit(sourceProcess, 'Git bundle creation'),
      waitForExit(encryptionProcess, 'age encryption'),
    ]);
    if (results.some((result) => result.status !== 'fulfilled')) {
      throw new Error('Git bundle encryption did not complete successfully');
    }
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;

    const info = statSync(output);
    if (!info.isFile() || info.size < 100 || (info.mode & 0o077) !== 0) {
      throw new Error('Encrypted output was empty or not private (0600)');
    }
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(output)) hash.update(chunk);
    return {
      result: 'ENCRYPTED_COPY_CREATED_UNVERIFIED',
      source_sha: sourceSha,
      git_ref_count: referenceCount,
      encrypted_bytes: info.size,
      encrypted_sha256: hash.digest('hex'),
      plaintext_bundle_written_to_disk: false,
      encrypted_backup_retained: true,
      independent_decryption_and_restore_verified: false,
      credentials_rotated: false,
      history_rewritten: false,
    };
  } catch {
    sourceProcess?.kill('SIGTERM');
    encryptionProcess?.kill('SIGTERM');
    if (fd !== undefined) {
      try { closeSync(fd); } catch { /* already closed */ }
    }
    // Remove only the inode that this process exclusively created. Never
    // unlink a pre-existing or concurrently replaced owner backup.
    if (createdFileIdentity) {
      try {
        const current = lstatSync(output);
        if (current.isFile() && current.dev === createdFileIdentity.dev &&
            current.ino === createdFileIdentity.ino) {
          unlinkSync(output);
        }
      } catch { /* no owned output remains */ }
    }
    throw new Error('Encrypted backup creation failed; partial output removed');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.env.CI) {
    console.error('REFUSED: owner-held backups must never be produced in CI.');
    process.exitCode = 1;
  } else {
    try {
      const result = await createEncryptedHistoryBackup({
        repository: process.env.SIRE_BACKUP_SOURCE ?? process.cwd(),
        destination: process.env.SIRE_ENCRYPTED_BACKUP_DEST,
        recipient: process.env.SIRE_AGE_RECIPIENT,
      });
      // Print only checksum and aggregate counters, never the owner path or public key.
      console.log(JSON.stringify(result, null, 2));
    } catch {
      console.error('REFUSED or FAILED: private recipient, 0700 destination and healthy Git/age required.');
      process.exitCode = 1;
    }
  }
}
