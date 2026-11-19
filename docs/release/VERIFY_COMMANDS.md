# Vishvakarma.OS Verification Commands

Use this file as the short local verification guide for this branch.

## Standard Check

```bash
pnpm install --frozen-lockfile
pnpm run launch:evidence
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
```

## Browser Check

```bash
pnpm run test:e2e
```

## Release Gate Check

```bash
pnpm run release:gates
```

`release:gates` can return a non-zero code while manual evidence is still pending. That means the software is not cleared for public release evidence claims yet; it does not automatically mean the build is broken.

## Stripe Billing Check (optional)

When `VITE_STRIPE_BILLING_ENABLED=true`:

```bash
pnpm run production:verify-env
pnpm run verify:stripe-billing --strict
```

Creating prices, changing active subscriptions and updating Cloudflare production bindings require the approved billing rollout.

Follow [STRIPE_SETUP.md](./STRIPE_SETUP.md) for webhook registration and checkout smoke test.

## Supabase Auth and Data Check

Production auth and persistence use Supabase. See [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md).

```bash
pnpm run verify:supabase-schema
node scripts/setup-supabase-auth-hardening.mjs --check
pnpm run verify:supabase-schema:live
pnpm run test:supabase-auth
pnpm run verify:supabase-login-data
pnpm run verify:production-auth-flow
pnpm run auth:gates
```

Export / validate migration JSON (optional):

```bash
node scripts/migration/export-supabase.mjs
node scripts/migration/validate-migration.mjs migration/export-*.json
pnpm run migration:import-supabase -- --in=migration/your-export.json
```

Verify administrator permissions using an approved test account and the [Supabase Auth runbook](./SUPABASE_AUTH_SETUP.md).

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) and [supabase/README.md](../../supabase/README.md) for auth and schema setup.

## Documentation Check

After route, API, schema, script, or documentation changes:

```bash
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
```

See [docs/DOCUMENTATION_STANDARDS.md](../DOCUMENTATION_STANDARDS.md).

## Final Evidence Check

Use this only after all placeholders in the evidence files are filled:

```bash
pnpm run launch:evidence:strict
```
