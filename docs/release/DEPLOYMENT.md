# Deployment Guide

## Vercel (production)

1. Connect GitHub repo to Vercel
2. Set Firebase env vars per [VERCEL_ENV.md](VERCEL_ENV.md)
3. Deploy: `pnpm run build` (configured in `vercel.json`)
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`

## Post-deploy verification

```bash
pnpm run production:verify-env --strict
PLAYWRIGHT_BASE_URL=https://your-domain.vercel.app pnpm run test:e2e:auth
pnpm run release:gates
```

## Monitoring

- Set `VITE_SENTRY_DSN` for error reporting (see `src/lib/monitoring.ts`)
- Analytics opt-in via `src/lib/analytics.ts`

## Support

- User FAQ: `docs/user/FAQ.md`
- Security: `SECURITY.md`
