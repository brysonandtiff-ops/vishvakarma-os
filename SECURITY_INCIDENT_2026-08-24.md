# Vishvakarma.OS Security Incident — 2026-08-24

## Confirmed exposure

A tracked Playwright storage-state file under `.local/cloudflare-auth/` contained a real Supabase authenticated session for the production Vishvakarma.OS project. The exact exposed Supabase session was revoked on 2026-08-24 and its associated refresh tokens were removed.

The tracked Stripe CLIXML file stores its credential value as Windows DPAPI-protected SecureString material rather than plaintext. It is still treated as forbidden local machine state and removed from source control.

## Containment

- Removed `.local/cloudflare-auth/storage-state.json` from tracked source.
- Removed `.local/cloudflare-auth/stripe-server-key.clixml` from tracked source.
- Removed `.local/cloudflare-auth/supabase-login.clixml` from tracked source.
- Added deny rules for `.local/`, `.wrangler/`, `.vercel/`, CLIXML, storage-state files, build output, and known local test logs.
- Hardened Cursor auto-ship exclusions so these paths cannot be automatically committed again.

## Remaining work

- Historical copies remain in Git history until a dedicated history rewrite is performed.
- Stripe secret rotation should still be completed if the DPAPI-protected value corresponds to an active live secret.
- Re-clone after history rewrite to prevent old clones from reintroducing removed material.
- Re-run repository secret scanning after history rewrite.
