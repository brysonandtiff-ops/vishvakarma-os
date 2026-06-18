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

### Sentry error tracking

`initMonitoring()` (called from `src/App.tsx`) initializes `@sentry/react` whenever
`VITE_SENTRY_DSN` is set. Set `VITE_SENTRY_DSN` in the Vercel production environment to
turn error tracking on — without it the SDK is a no-op and **production errors are not
captured**.

- Client errors captured via `src/lib/monitoring.ts`; the app error boundary
  (`src/components/common/AppErrorBoundary.tsx`) reports caught render errors.
- Production builds emit **hidden source maps** (`vite.config.ts` → `build.sourcemap: 'hidden'`)
  so Sentry stack traces are readable. To symbolicate, either upload the `dist/**/*.map`
  files to Sentry on release (Sentry Vite plugin + `SENTRY_AUTH_TOKEN`) or keep the maps
  available to the Sentry project. Hidden maps are not referenced from shipped bundles.
- PII stripped from breadcrumbs per [SECURITY.md](../../SECURITY.md).

### Vercel Analytics — activation funnel

Page views and Web Vitals are captured by `<Analytics />` (mounted in `src/App.tsx`).
Custom funnel events are emitted through `trackEvent()` in `src/lib/analytics.ts` (only
after analytics consent, and only in production):

| Event | Emitted when | Properties |
|-------|--------------|------------|
| `sign_in_succeeded` | Supabase `SIGNED_IN` auth event | `provider` |
| `project_created` | New project saved | `backend` (supabase/local), `template` |
| `project_exported` | Any export completes | `format` (json/png/svg/pdf/sheet-set-pdf/dxf) |

Track sign-in → project_created → project_exported as the core activation funnel in the
Vercel Analytics dashboard. (Custom events require a Vercel Analytics paid plan; without
it they are silently dropped — page views and Web Vitals still work.)

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
