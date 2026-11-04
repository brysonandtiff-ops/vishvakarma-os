# Vishvakarma.OS — Owner-only recovery key on Android (Termux)

**S.I.R.E. LAW 105 Ω**  
**Status: INSTRUCTIONS PREPARED / REAL KEY NOT GENERATED OR VERIFIED**  
**Primary device:** owner's Android phone, inside the private Termux application directory.  
**Scope:** prepare only the encryption recipient and a passphrase-encrypted owner identity. This does **not** back up or recover Git history.

## 1. Critical requirements

- Use a genuine installed **Termux** app on the owner's Android phone, in its private app storage. Do **not** run in a cloud CI runner, a shared storage folder, an SSH session, or in a browser.
- Never paste a private key or passphrase into ChatGPT, GitHub, Cloudflare, terminal screenshots, command-line flags, build logs or support tickets.
- Use a long unique passphrase and store it in an independent password manager or offline recovery record.
- Before you rely on the key, make an **independent offline copy** of the resulting **encrypted** `owner-identity.age`. Keeping the only copy on the phone is **not** disaster recovery.
- A real backup requires the existing Git history exporter, exact source/ref inventory and separate restore proof in PR #206. No history rewrite is authorised.

## 2. Install the established age tool

In an ordinary Termux terminal, run:

```bash
pkg update && pkg install age
```

If the package install fails, stop. Never download an unknown replacement binary.

## 3. One-time local, passphrase-encrypted key creation

Copy this block into **Termux only**. It deliberately refuses to overwrite an existing recovery folder. It does not write a plaintext private identity file.

```bash
(
  set -euo pipefail
  umask 077
  case "$HOME" in
    /data/data/com.termux/files/home|/data/user/0/com.termux/files/home) ;;
    *) printf 'BLOCKED: run in the private Termux home directory.\n' >&2; exit 1 ;;
  esac
  command -v age >/dev/null
  command -v age-keygen >/dev/null

  key_dir="$HOME/.sire-vishvakarma-recovery"
  mkdir -m 700 -- "$key_dir"

  # The secret key exists only in the pipe and encrypted .age output.
  # Choose and preserve a unique strong passphrase when prompted.
  age-keygen | age -p -o "$key_dir/owner-identity.age"

  test -s "$key_dir/owner-identity.age"
  test "$(stat -c '%a' "$key_dir/owner-identity.age")" = '600'

  # Requests the passphrase again. Prints ONLY the public age1... recipient.
  age -d "$key_dir/owner-identity.age" | age-keygen -y
)
```

**Why this is safe by design:** `age-keygen` streams the identity directly into `age -p`. No unencrypted identity is stored on disk by these commands. `umask 077` and the 0700 folder restrict access. `mkdir` without `-p` refuses to reuse an existing vault; if interrupted, inspect it rather than deleting or rerunning over it. The final public-key derivation tests that the encrypted identity can be opened with the owner's passphrase.

**Limit:** This is not a hardware-keystore identity. If the passphrase and encrypted identity are stolen together, security may be compromised; protect them separately.

## 4. Offline recovery copy

Copy **only** the encrypted `$HOME/.sire-vishvakarma-recovery/owner-identity.age` to a separately protected offline location controlled by the owner. Keep its long unique passphrase in a different safe location. Do not upload the owner identity (even the encrypted identity) to the Vishvakarma backup bucket as a substitute for independent custody.

Prove the offline copy can be read and independently decrypted **without** exposing the private identity in logs. Keep receipts with hashes/counts only, never the raw key.

## 5. Evidence handoff and next gate

Only the derived **public** `age1...` recipient may be supplied to the authorised cloud backup encryptor. The private identity and passphrase must stay with the owner. Report only:
- `owner_encrypted_identity_created: yes/no`
- `public_recipient_derived: yes/no`
- `independent_offline_copy_verified: yes/no`
- `encrypted_repo_backup_retained: no`
- `independent_git_restore_verified: no`

The backup and Git history rewrite remain **BLOCKED** until an owner-controlled cloud job encrypts the complete authorised Git ref inventory to the public recipient, stores *ciphertext only* in the already-private R2 vault, and an independent, RAM-only restore verifies the exact source/ref OIDs.

### References

- Upstream age documentation: https://github.com/FiloSottile/age/blob/main/doc/age.1.ronn
- age identity generation: https://github.com/FiloSottile/age/blob/main/doc/age-keygen.1.ronn
- Backups and full Git refs: https://github.com/brysonandtiff-ops/vishvakarma-os/pull/206
- Vault evidence: https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188
