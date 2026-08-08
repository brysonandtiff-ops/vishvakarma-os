# Production Closeout Evidence — 2026-07-16

## Scope

- Repository: `brysonandtiff-ops/vishvakarma-os`
- Branch: `agent/production-closeout-20260716`
- Base production SHA: `73b0a40318b96512c6dbecd8d0ab5f0aedc45a3b`
- Evidence snapshot parent: `49f1b27f9fd9927d8cac2d0b08ce5195bc1b88ae`
- Production URL: https://vishvakarma-os.app
- Supabase project: `jyocvwipthswfcmvqgqe` (`ACTIVE_HEALTHY`)

## Database migration reconciliation

The following migrations were read from the live `supabase_migrations.schema_migrations` history and added to the repository using the exact applied SQL:

1. `20260711194914_harden_internal_functions_storage_and_indexes.sql`
2. `20260711195543_bind_audit_log_inserts_to_authenticated_actor.sql`
3. `20260711195753_move_admin_check_out_of_exposed_schema.sql`
4. `20260711195911_optimize_rls_auth_uid_initplans.sql`
5. `20260711200108_remove_anonymous_access_from_authenticated_tables.sql`
6. `20260712095528_enforce_opt_in_totp_mfa.sql`

## Live verification query

Executed against production on 2026-07-16. Result:

| Assertion | Result |
|---|---:|
| Missing expected live migrations | `0` |
| Anonymous grants on protected application tables | `0` |
| `anon`/`authenticated` grants on `public.ai_usage` | `0` |
| Public materials object-listing policies | `0` |
| Actor-bound audit insert policies | `1` |
| `app_private.is_admin()` present | `true` |
| `public.is_admin()` absent | `true` |
| Restrictive opt-in MFA policies | `13` |
| Requester foreign-key index present | `true` |
| Reviewer foreign-key index present | `true` |
| Optimization project index present | `true` |
| Audit actor/timestamp index present | `true` |

## Supabase advisor snapshot

### Resolved targeted findings

- Internal trigger/event-trigger functions are not executable by `anon` or ordinary authenticated users.
- `is_admin()` is no longer exposed from the `public` schema.
- Arbitrary public listing of the `materials` bucket is removed while known public object URLs remain supported.
- `ai_usage` is deny-by-default for browser clients.
- Audit inserts are bound to the authenticated actor and validated.
- Accidental anonymous grants on signed-in application tables are removed.
- RLS `auth.uid()` initialization-plan warnings are resolved.
- Required foreign-key and audit lookup indexes exist.

### Accepted/remaining advisor notices

- `public.ai_usage` reports **RLS enabled with no policy**. This is intentional: only `service_role` may access the metering table.
- Authenticated GraphQL schema visibility remains for application tables that the browser client queries directly. Row authorization remains enforced by RLS; removing `SELECT` would break the current Supabase Data API architecture. Revisit only alongside an API/server-gateway migration.
- Unused-index notices are informational on a low-traffic project and are not grounds for removing required foreign-key or operational indexes.
- Supabase Auth still reports leaked-password protection disabled and insufficient platform MFA options. Database-level opt-in TOTP enforcement is active, but the dashboard settings require an operator change and are not represented as completed here.

## Verification truth

GitHub Actions is intentionally disabled by owner policy. Historical workflow PASS records apply only to their original SHAs. This closeout records live database verification and Vercel deployment status; it does **not** invent a local application test PASS.

Before merge/release promotion, a trusted local checkout must attach results for:

```bash
pnpm install --frozen-lockfile
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
pnpm run lint
pnpm run verify:ci
pnpm run test:e2e
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

## Verdict

`DATABASE SECURITY CLOSEOUT: PASS`

`REPOSITORY / DEPLOYMENT CLOSEOUT: PENDING LOCAL GATE ATTACHMENT AND SUPABASE AUTH DASHBOARD SETTINGS`
