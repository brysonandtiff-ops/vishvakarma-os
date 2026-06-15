# Rollback Procedures

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

How to revert a bad production deploy without data loss.

---

## Vercel instant rollback (preferred)

1. Open Vercel Dashboard → Project → Deployments
2. Find the last known-good production deployment
3. Click **⋯** → **Promote to Production**

Rollback is typically **under 60 seconds**. No rebuild required.

Verify post-rollback using [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) smoke checklist.

---

## Git revert (when code fix required)

```bash
git revert <bad-commit-sha>
git push origin main
```

Vercel redeploys from the reverted commit. Run full `verify:ci` locally before push when possible.

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

Gemini routes (`/api/ai/*`) are stateless. Rollback Vercel deployment; no data migration needed. Users fall back to local parsers when `GEMINI_API_KEY` is missing.

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
