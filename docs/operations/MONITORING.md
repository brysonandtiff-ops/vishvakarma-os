# Monitoring and Observability

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

What to watch in production and where dashboards live.

---

## Dashboards

| Service | URL / location | Watch for |
|---------|----------------|-----------|
| **Vercel** | vercel.com dashboard | Deploy failures, function errors, bandwidth |
| **Supabase** | supabase.com dashboard | Auth errors, DB connections, RLS denials, storage |
| **Stripe** | dashboard.stripe.com | Webhook failures, dispute spikes, churn |
| **Google AI** | Google Cloud console | Gemini quota, API errors |
| **GitHub Actions** | repo Actions tab | CI failures on `main` |

---

## Application monitoring

### Sentry (optional)

When `VITE_SENTRY_DSN` is configured:

- Client errors captured via `src/lib/monitoring.ts`
- PII stripped from breadcrumbs per [SECURITY.md](../../SECURITY.md)

**Status:** Scaffold — confirm SDK dependency before relying on alerts.

### Vercel Analytics

Enabled when deployment analytics are on. Page views and Web Vitals at project level.

### Analytics consent

Product analytics require explicit opt-in via consent banner (`src/lib/analytics.ts`).

---

## Synthetic checks

Run on schedule or post-deploy:

```bash
pnpm run verify:production-auth-flow
pnpm run verify:supabase-schema:live
pnpm run production:verify-env --strict
```

CI evidence snapshot: [release/evidence/latest-ci-run.md](../release/evidence/latest-ci-run.md)

---

## Alert recommendations

| Signal | Threshold | Action |
|--------|-------------|--------|
| Vercel function 5xx rate | Sustained > 1% | Check logs; consider rollback |
| Supabase auth error spike | > 10/min | Auth playbook |
| Stripe webhook failures | Any repeated failure | Billing playbook |
| CI red on `main` | Any failure | Block further deploys until green |

Configure alerts in each vendor dashboard — no centralized on-call pager is shipped in-repo.

---

## Log locations

| Component | Logs |
|-----------|------|
| Vercel serverless | Vercel → Functions → Logs |
| Supabase Postgres | Supabase → Logs Explorer |
| Supabase Auth | Authentication → Logs |
| Client | Browser devtools (user-reported) |

---

## Related

- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [handoff/07-integrations-and-accounts.md](../handoff/07-integrations-and-accounts.md)
