# Rollback Procedures

**Product version:** v1.5.0

**Procedure updated:** 2026-11-19

**Audience:** operator


How to revert a bad production deploy without data loss.

---

## Cloudflare Pages rollback

1. Open Cloudflare Pages → `vishvakarma-os` → Deployments.
2. Match the last approved production deployment ID and source to the current release receipt. Check compatibility with any migrations already applied.
3. Use the Cloudflare Pages rollback control after owner approval. Verify the resulting deployment and smoke-test the public origin, signed-in Studio and API through the [deployment runbook](DEPLOYMENT_RUNBOOK.md).

---

## Git revert (when code fix required)

Create a reviewed revert on a branch. Run `pnpm run verify:ci` and use the source-bound Cloudflare review and production process.

---

## Supabase migrations

**Policy:** Do not roll back applied migrations in production without operator review.

- Forward-fix preferred: ship a new migration that reverses schema changes
- `supabase db reset` is **local/dev only** — never on production
- Document any manual SQL in operator annex and audit log

If a migration caused data issues, restore from Supabase point-in-time recovery (if enabled on plan) via Supabase Dashboard.

---

## Stripe webhook replay

If billing entitlements desynced during an incident:

1. Stripe Dashboard → Developers → Webhooks → select endpoint
2. Review failed events → **Resend** after fixing root cause
3. Verify `billing` rows in Supabase for affected users
4. Manual fix: update `billing.plan` and `billing.status` via Supabase SQL editor (last resort — document in audit)

---

## AI routes

Gemini routes (`/api/ai/*`) are stateless. Roll back the Pages deployment if the fault is isolated to application code. Users fall back to local parsers when `GEMINI_API_KEY` is missing.

---

## Communication template

```
Subject: [Vishvakarma.OS] Production rollback — <date>

We rolled back production to deployment <id> at <time> UTC due to <brief reason>.
Impact: <auth / billing / editor / none>
Current status: <monitoring / resolved>
Next steps: <fix forward PR / investigation>
```

---

## Related

- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [MONITORING.md](./MONITORING.md)
