# Account Transfer Checklist

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

Operator handover when transferring Vishvakarma.OS to a new owner or acquirer.

Full integration registry: [handoff/07-integrations-and-accounts.md](../handoff/07-integrations-and-accounts.md)

---

## Operator annex (secrets off-repo)

1. Copy [handoff/templates/OPERATOR_ANNEX.template.md](../handoff/templates/OPERATOR_ANNEX.template.md)
2. Save as `docs/handoff/OPERATOR_ANNEX.md` (gitignored)
3. Complete all account ownership fields
4. Deliver via secure channel (password manager, encrypted data room)

**Never commit filled operator annexes to git.**

---

## Accounts to transfer

| Service | Transfer action |
|---------|-----------------|
| **GitHub** | Repo ownership or org transfer |
| **Vercel** | Project transfer; verify env vars |
| **Supabase** | Organization/project ownership |
| **Stripe** | Account ownership or Connect migration plan |
| **Google Cloud / Gemini** | API key rotation to acquirer project |
| **Domain** | `vishvakarma-os.app` DNS to acquirer registrar |

---

## Key rotation (post-transfer)

Rotate immediately after transfer:

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- [ ] `GEMINI_API_KEY`
- [ ] Supabase anon key (if compromise suspected)
- [ ] OAuth client secrets (Google, Apple) in Supabase Auth providers
- [ ] Remove prior operator from Supabase/Vercel/Stripe admin lists

Update Vercel Production env after rotation. Redeploy.

---

## Code-level dependencies

Review and update if transferring to external team:

- Co-owner allowlist: `src/config/coOwners.ts`
- Stripe price IDs in Vercel env
- Supabase project ref: `jyocvwipthswfcmvqgqe`
- Authorized domains in Supabase Auth settings

---

## Verification after transfer

```bash
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
```

Manual: new operator completes OAuth sign-in and Stripe checkout smoke test.

---

## Documentation handoff

Deliver with codebase:

- [handoff/HANDOFF.md](../handoff/HANDOFF.md) — master index
- [SOFTWARE_INVENTORY.md](../SOFTWARE_INVENTORY.md)
- Filled operator annex (secure channel)
- [release/evidence/EVIDENCE_MANIFEST.md](../release/evidence/EVIDENCE_MANIFEST.md)

---

## Related

- [MIGRATION.md](../../MIGRATION.md) — data portability
- [PROPRIETARY_NOTICE.md](../PROPRIETARY_NOTICE.md) — IP posture
