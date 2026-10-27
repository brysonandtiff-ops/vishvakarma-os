import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEncryptedHistoryBackup } from './create-encrypted-history-backup.mjs';
import { verifyEncryptedHistoryBackup } from './verify-encrypted-history-backup.mjs';

const run = (cwd, command, ...args) => execFileSync(command, args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'sire-private-restore-test-'));
  const repository = join(root, 'repo');
  const privateDir = join(root, 'backup-0700');
  mkdirSync(repository);
  mkdirSync(privateDir, { mode: 0o700 });
  run(repository, 'git', 'init', '--quiet', '--initial-branch=main');
  run(repository, 'git', 'config', 'user.email', 'test@example.invalid');
  run(repository, 'git', 'config', 'user.name', 'Synthetic Restore Test');
  writeFileSync(join(repository, 'only-fictional.txt'), 'fictional sample, no credentials\n');
  run(repository, 'git', 'add', 'only-fictional.txt');
  run(repository, 'git', 'commit', '-qm', 'first synthetic fixture');
  run(repository, 'git', 'branch', 'sample-branch');
  run(repository, 'git', 'tag', 'sample-tag');
  writeFileSync(join(repository, 'only-fictional.txt'), 'second synthetic revision\n');
  run(repository, 'git', 'commit', '-qam', 'second synthetic fixture');
  const identityFile = join(privateDir, 'age-test-identity.txt');
  run(root, 'age-keygen', '-o', identityFile);
  chmodSync(identityFile, 0o600);
  const match = readFileSync(identityFile, 'utf8').match(/# public key: (age1[0-9a-z]{40,80})/);
  if (!match) throw new Error('Synthetic recipient generation failed');
  const encryptedArchive = join(privateDir, 'history.age');
  const receipt = await createEncryptedHistoryBackup({
    repository, destination: encryptedArchive, recipient: match[1],
  });
  return { root, repository, privateDir, encryptedArchive, identityFile, receipt };
}
function privateTempFolders() {
  return readdirSync('/dev/shm').filter((n) => n.startsWith('sire-private-restore-')).sort();
}

describe('owner-side encrypted history restore — synthetic keys/data only', () => {
  it('verifies ciphertext, private-key decryption, exact refs, commits, fsck and RAM cleanup', async () => {
    const f = await fixture();
    const before = privateTempFolders();
    try {
      const result = await verifyEncryptedHistoryBackup({
        repository: f.repository, encryptedArchive: f.encryptedArchive,
        identityFile: f.identityFile, receipt: f.receipt,
      });
      expect(result).toMatchObject({
        result: 'OWNER_BACKUP_RESTORE_VERIFIED_FOR_UNCHANGED_SOURCE',
        exact_source_sha: f.receipt.source_sha,
        ref_count: 3,
        reachable_commit_count: 2,
        encrypted_sha256_verified: true,
        private_key_decryption_verified: true,
        exact_ref_oid_match: true,
        mirror_fsck_verified: true,
        plaintext_persistent_disk_copy_created: false,
        temporary_plaintext_deleted: true,
        credentials_rotated: false,
        history_rewritten: false,
        release_authorized: false,
      });
      expect(privateTempFolders()).toEqual(before);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  });

  it('refuses a forged checksum before any decrypted RAM archive is created', async () => {
    const f = await fixture();
    const before = privateTempFolders();
    try {
      await expect(verifyEncryptedHistoryBackup({
        repository: f.repository, encryptedArchive: f.encryptedArchive,
        identityFile: f.identityFile, receipt: {
          ...f.receipt, encrypted_sha256: '0'.repeat(64),
        },
      })).rejects.toThrow(/SHA256/);
      expect(privateTempFolders()).toEqual(before);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });

  it('rejects the wrong private identity and still cleans decrypted RAM workspace', async () => {
    const f = await fixture();
    const wrongKey = join(f.privateDir, 'unrelated-key.txt');
    run(f.root, 'age-keygen', '-o', wrongKey);
    chmodSync(wrongKey, 0o600);
    const before = privateTempFolders();
    try {
      await expect(verifyEncryptedHistoryBackup({
        repository: f.repository, encryptedArchive: f.encryptedArchive,
        identityFile: wrongKey, receipt: f.receipt,
      })).rejects.toThrow(/decryption/);
      expect(privateTempFolders()).toEqual(before);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });

  it('refuses disk-backed decrypted storage even when encryption input is valid', async () => {
    const f = await fixture();
    try {
      await expect(verifyEncryptedHistoryBackup({
        repository: f.repository, encryptedArchive: f.encryptedArchive,
        identityFile: f.identityFile, receipt: f.receipt, ramRoot: f.privateDir,
      })).rejects.toThrow(/tmpfs/);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });

  it('refuses changed source revision before decrypting an old backup', async () => {
    const f = await fixture();
    const before = privateTempFolders();
    try {
      writeFileSync(join(f.repository, 'only-fictional.txt'), 'third synthetic revision\n');
      run(f.repository, 'git', 'commit', '-qam', 'new synthetic commit');
      await expect(verifyEncryptedHistoryBackup({
        repository: f.repository, encryptedArchive: f.encryptedArchive,
        identityFile: f.identityFile, receipt: f.receipt,
      })).rejects.toThrow(/HEAD no longer matches/);
      expect(privateTempFolders()).toEqual(before);
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});
