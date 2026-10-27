import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createEncryptedHistoryBackup,
  validateEncryptedBackupDestination,
} from './create-encrypted-history-backup.mjs';

const run = (cwd, name, ...args) =>
  execFileSync(name, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'sire-age-bundle-test-'));
  const repository = join(root, 'repo');
  const safe = join(root, 'owner-0700');
  const unsafe = join(root, 'world-readable');
  mkdirSync(repository);
  mkdirSync(safe, { mode: 0o700 });
  mkdirSync(unsafe, { mode: 0o755 });
  run(repository, 'git', 'init', '-q', '--initial-branch=main');
  run(repository, 'git', 'config', 'user.email', 'test@example.invalid');
  run(repository, 'git', 'config', 'user.name', 'Synthetic Backup Test');
  writeFileSync(join(repository, 'only-fixture.txt'), 'synthetic data, never credentials\n');
  run(repository, 'git', 'add', 'only-fixture.txt');
  run(repository, 'git', 'commit', '-qm', 'first synthetic commit');
  run(repository, 'git', 'tag', 'synthetic-tag');
  run(repository, 'git', 'branch', 'safe-feature');
  writeFileSync(join(repository, 'only-fixture.txt'), 'second synthetic revision\n');
  run(repository, 'git', 'commit', '-qam', 'second synthetic commit');

  const identity = join(safe, 'test-only-age-identity.txt');
  run(root, 'age-keygen', '-o', identity);
  const match = readFileSync(identity, 'utf8').match(/# public key: (age1[0-9a-z]{40,80})/);
  if (!match) throw new Error('Could not derive a synthetic age test recipient');
  return {
    root, repository, safe, unsafe, identity,
    recipient: match[1], destination: join(safe, 'owner-history.age'),
  };
}

describe('private recipient-encrypted Git backup — synthetic repository only', () => {
  it('streams Git refs through age, retains only ciphertext, then independently decrypts and restores', async () => {
    const f = fixture();
    try {
      const receipt = await createEncryptedHistoryBackup({
        repository: f.repository,
        destination: f.destination,
        recipient: f.recipient,
      });
      expect(receipt).toMatchObject({
        result: 'ENCRYPTED_COPY_CREATED_UNVERIFIED',
        git_ref_count: 3,
        plaintext_bundle_written_to_disk: false,
        encrypted_backup_retained: true,
        independent_decryption_and_restore_verified: false,
        history_rewritten: false,
      });
      expect(receipt.encrypted_bytes).toBeGreaterThan(100);
      expect(receipt.encrypted_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(statSync(f.destination).mode & 0o077).toBe(0);
      const ciphertext = readFileSync(f.destination);
      expect(ciphertext.subarray(0, 22).toString()).toContain('age-encryption.org/v1');
      expect(ciphertext.includes(Buffer.from('synthetic data, never credentials'))).toBe(false);

      // Restore a synthetic-only bundle under the private temp fixture.
      const decrypted = join(f.safe, 'synthetic-plaintext.bundle');
      run(f.safe, 'age', '-d', '-i', f.identity, '-o', decrypted, f.destination);
      run(f.repository, 'git', 'bundle', 'verify', decrypted);
      const restored = join(f.safe, 'restored.git');
      run(f.safe, 'git', 'clone', '--mirror', '--quiet', decrypted, restored);
      run(restored, 'git', 'fsck', '--full', '--no-reflogs', '--no-progress');
      const originals = run(f.repository, 'git', 'for-each-ref', '--format=%(refname) %(objectname)',
        'refs/heads', 'refs/tags').split('\n').sort();
      const copies = run(restored, 'git', 'for-each-ref', '--format=%(refname) %(objectname)',
        'refs/heads', 'refs/tags').split('\n').sort();
      expect(copies).toEqual(originals);
      expect(run(restored, 'git', 'rev-list', '--all', '--count')).toBe('2');
      expect(run(f.repository, 'git', 'status', '--porcelain')).toBe('');
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  it('refuses invalid key, relative destination, repository-local and world-readable locations', () => {
    const f = fixture();
    try {
      expect(() => validateEncryptedBackupDestination({
        repository: f.repository, destination: f.destination, recipient: 'not-an-age-key',
      })).toThrow(/recipient/i);
      expect(() => validateEncryptedBackupDestination({
        repository: f.repository, destination: 'relative.age', recipient: f.recipient,
      })).toThrow(/absolute/i);
      expect(() => validateEncryptedBackupDestination({
        repository: f.repository, destination: join(f.repository, 'secret.age'), recipient: f.recipient,
      })).toThrow(/inside the Git repository/i);
      expect(() => validateEncryptedBackupDestination({
        repository: f.repository, destination: join(f.unsafe, 'secret.age'), recipient: f.recipient,
      })).toThrow(/private/i);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  it('never overwrites an existing backup, including same-key reruns', async () => {
    const f = fixture();
    try {
      writeFileSync(f.destination, 'existing archive — must remain intact');
      await expect(createEncryptedHistoryBackup({
        repository: f.repository, destination: f.destination, recipient: f.recipient,
      })).rejects.toThrow(/overwrite/);
      expect(readFileSync(f.destination, 'utf8')).toBe('existing archive — must remain intact');
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  it('fails before creating output when age is unavailable', async () => {
    const f = fixture();
    try {
      await expect(createEncryptedHistoryBackup({
        repository: f.repository, destination: f.destination, recipient: f.recipient,
        ageBinary: 'not-a-real-age-binary',
      })).rejects.toThrow();
      expect(existsSync(f.destination)).toBe(false);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  it('removes only its own partial ciphertext after an encryption subprocess failure', async () => {
    const f = fixture();
    try {
      const broken = join(f.safe, 'synthetic-age-failure.sh');
      writeFileSync(broken, '#!/bin/sh\nif [ "$1" = "--version" ]; then exit 0; fi\nexit 11\n');
      chmodSync(broken, 0o700);
      await expect(createEncryptedHistoryBackup({
        repository: f.repository,
        destination: f.destination,
        recipient: f.recipient,
        ageBinary: broken,
      })).rejects.toThrow(/creation failed/);
      expect(existsSync(f.destination)).toBe(false);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });
});
