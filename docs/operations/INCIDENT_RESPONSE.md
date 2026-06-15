# Incident Response

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

Severity definitions, common incident playbooks, and escalation templates.

---

## Severity levels

| Level | Definition | Response target |
|-------|------------|-----------------|
| **SEV-1** | Production down or auth/billing completely broken | Immediate rollback + owner notify |
| **SEV-2** | Major feature degraded (editor save, 3D, exports) | Fix or rollback within 4 hours |
| **SEV-3** | Partial degradation, workaround exists | Fix within 1 business day |
| **SEV-4** | Cosmetic, docs, non-production | Next scheduled release |

---

## Playbook: Auth outage

**Symptoms:** `/auth` errors, OAuth redirect loops, 401 on all private routes

1. Check Supabase Dashboard → Authentication → Logs
2. Verify `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_REDIRECT_ORIGIN` on Vercel Production
3. Confirm authorized redirect URLs include `https://vishvakarma-os.app`
4. Run `pnpm run verify:production-auth-flow`
5. If bad deploy: [ROLLBACK.md](./ROLLBACK.md)

---

## Playbook: Billing / webhook failure

**Symptoms:** Checkout succeeds but plan not upgraded; portal 500 errors

1. Stripe Dashboard → Webhooks → check delivery failures
2. Verify `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` on Vercel
3. Resend failed webhook events after fix
4. Inspect Supabase `billing` table for affected `user_id`
5. See [release/STRIPE_SETUP.md](../release/STRIPE_SETUP.md)

---

## Playbook: AI routes down

**Symptoms:** Copilot returns errors; `source: fallback` only

1. Verify `GEMINI_API_KEY` on Vercel (server-only)
2. Check Google AI quota and API status
3. **Impact:** Local parsers still work — SEV-3 unless AI is contractually guaranteed

---

## Playbook: Data integrity

**Symptoms:** Projects missing, manifest corruption, RLS denials

1. Check Supabase logs and RLS policies
2. Identify scope: single user vs widespread
3. Restore from backup if migration-related (see [ROLLBACK.md](./ROLLBACK.md))
4. Document in audit log and operator annex

---

## Playbook: 3D / WebGL issues

**Symptoms:** Blank viewport, user reports on iPad Safari

1. Usually client-side — not a server incident (SEV-4 unless widespread)
2. Direct users to [user/TROUBLESHOOTING.md](../user/TROUBLESHOOTING.md)
3. Track browser/version in incident notes

---

## Escalation

1. Operator on call assesses severity
2. SEV-1/2: rollback first, investigate second
3. Post-incident: update evidence or runbook if gap found
4. Security incidents: follow [SECURITY.md](../../SECURITY.md) — do not disclose publicly before fix

---

## Related

- [MONITORING.md](./MONITORING.md)
- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)
