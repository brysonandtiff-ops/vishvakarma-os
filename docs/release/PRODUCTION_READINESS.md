# Vishvakarma.OS — Production Readiness Evidence

**Status:** Release hardening and auth hardening added. Final production approval requires the GitHub Actions `Verify Vishvakarma.OS` workflow to pass on the release commit.

**Last updated:** 2026-05-21

---

## Release Gate Summary

| Gate | Required Proof | Status |
|---|---|---|
| Package identity | `package.json` name is `vishvakarma-os` and repository is private unless intentionally public | Added |
| Package manager lock | `pnpm-lock.yaml` is the source of truth and CI installs with `pnpm install --frozen-lockfile` | Added |
| Lint | `pnpm run lint` exits 0 | Enforced in CI |
| Unit tests | `pnpm run test` exits 0 | Enforced in CI |
| Production route smoke | `pnpm run test:routes` verifies route list, public/private access policy, and renderable elements | Added and enforced in CI |
| Production build | `pnpm run build` creates `dist/` | Enforced in CI |
| Build artifact | CI uploads `dist/` as `vishvakarma-os-dist` | Added |
| Passwordless account access | `/auth` uses Supabase email-link account access | Added |
| App route guard | All application routes are private in production; only `/auth` is public | Added |
| Account shell controls | App shell shows account/session mode and sign-out control | Added |
| Profile creation | Supabase trigger creates `profiles` rows for new auth users | Added |
| RLS baseline | User-owned app tables are row-level-security scoped by `user_id` | Added |
| Environment template | `.env.example` documents required Supabase variables and auth setup checklist | Added |
| Local-only safety | Missing Supabase env no longer creates an invalid production crash path | Added |
| Vercel SPA routing | Deep links rewrite to `index.html` | Added |
| Security headers | Baseline browser hardening headers configured in `vercel.json` | Added |

---

## Production Approval Rule

Do **not** mark a release as production ready unless all of these are true:

1. The latest commit on `main` has a passing GitHub Actions run named **Verify Vishvakarma.OS**.
2. The `dist/` artifact is present in that workflow run.
3. A deployed preview opens every production route:
   - `/auth`
   - `/`
   - `/spec-center`
   - `/registry`
   - `/change-requests`
   - `/releases`
   - `/audit`
4. Supabase production environment variables are configured in the host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Supabase Auth is configured:
   - email link / OTP provider enabled
   - production site URL allowlisted
   - preview/local URLs allowlisted when needed
6. Supabase migrations are applied before real users are invited.
7. Manual smoke test confirms:
   - `/auth` loads while signed out
   - signed-out users cannot access private app routes in production
   - account creation/sign-in email link reaches the configured site URL
   - editor loads after sign-in
   - account/sign-out controls are visible in the app shell
   - 2D editor remains usable if WebGL is unavailable
   - governance pages render without blank screens

---

## Local Verification

```bash
pnpm install --frozen-lockfile
pnpm run verify:ci
pnpm run preview
```

Open the preview and test every production route listed above.

---

## Auth / RLS Verification

Run these checks against the Supabase project before production release:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'projects', 'specs', 'registry', 'change_requests', 'releases', 'audit_logs');
```

Expected: every listed table that exists has `rowsecurity = true`.

Also create a test user through `/auth`, confirm a `profiles` row is created, then confirm that user-owned rows are only visible to the signed-in owner.

---

## Known Production Risks Remaining

| Risk | Impact | Required Next Action |
|---|---|---|
| No full browser E2E suite yet | Route manifest is checked, but user flows are not fully browser-driven | Add Playwright route open + auth redirect + editor smoke tests |
| Supabase RLS not proven by live advisor output yet | Persistence/security depends on live database policies | Add Supabase advisor output and screenshot/SQL proof |
| Large 3D bundle | May affect lower-end iPads | Add bundle analysis and code-split 3D chamber if needed |
| Manual deployment proof not attached | CI creates artifact but does not prove hosted preview health | Attach Vercel deployment URL and screenshots |

---

## Stop-Ship Conditions

The release must be blocked if any of these occur:

- GitHub Actions verification fails.
- Supabase production env values are missing for production release.
- Supabase Auth email-link flow is not configured.
- Supabase migrations are not applied.
- Any private production route is reachable while signed out.
- Account creation does not create a profile row.
- Any production route renders a blank page.
- WebGL failure crashes the whole app instead of degrading gracefully.
- `pnpm install --frozen-lockfile` fails.
- `pnpm run verify:ci` fails.

---

## Evidence Checklist

- [ ] GitHub Actions workflow URL attached
- [ ] `vishvakarma-os-dist` artifact attached
- [ ] Vercel deployment URL attached
- [ ] `/auth` screenshot while signed out attached
- [ ] Private-route redirect proof attached
- [ ] Successful email-link sign-in proof attached
- [ ] Screenshots for all six private production routes attached
- [ ] Supabase environment configured in host
- [ ] Supabase Auth URL/provider proof attached
- [ ] Supabase RLS/advisor evidence attached
- [ ] Profile auto-creation proof attached
- [ ] Manual iPad/tablet smoke test recorded
- [ ] Known risks either fixed or explicitly accepted
