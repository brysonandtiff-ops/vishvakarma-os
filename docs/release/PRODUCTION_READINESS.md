# Vishvakarma.OS — Production Readiness Evidence

**Status:** Release hardening, auth hardening, browser E2E scaffold, and Supabase RLS evidence runbook added. Final production approval requires the GitHub Actions `Verify Vishvakarma.OS` and `E2E Auth Gate` workflows to pass on the release commit.

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
| Browser auth E2E | Playwright verifies `/auth` loads and signed-out users are redirected from private routes | Added in `E2E Auth Gate` workflow |
| Production build | `pnpm run build` creates `dist/` | Enforced in CI |
| Build artifact | CI uploads `dist/` as `vishvakarma-os-dist` | Added |
| Passwordless account access | `/auth` uses Firebase email-link account access | Added |
| Data persistence | Supabase stores projects, registry, releases, audit logs | Added |
| App route guard | All application routes are private in production; only `/auth` is public | Added |
| Account shell controls | App shell shows account/session mode and sign-out control | Added |
| Profile creation | Supabase trigger creates `profiles` rows for new auth users | Added |
| RLS baseline | User-owned app tables are row-level-security scoped by `user_id` | Added |
| RLS evidence runbook | `docs/release/SUPABASE_RLS_EVIDENCE.md` documents exact proof queries and manual checks | Added |
| Environment template | `.env.example` documents required Supabase variables and auth setup checklist | Added |
| Local-only safety | Missing Supabase env no longer creates an invalid production crash path | Added |
| Vercel SPA routing | Deep links rewrite to `index.html` | Added |
| Security headers | Baseline browser hardening headers configured in `vercel.json` | Added |

---

## Production Approval Rule

Do **not** mark a release as production ready unless all of these are true:

1. The latest commit on `main` has passing GitHub Actions runs named **Verify Vishvakarma.OS** and **E2E Auth Gate**.
2. The `dist/` artifact is present in the verify workflow run.
3. The Playwright report is attached or inspected for the E2E workflow run.
4. A deployed preview opens every production route:
   - `/auth`
   - `/`
   - `/spec-center`
   - `/registry`
   - `/change-requests`
   - `/releases`
   - `/audit`
5. Supabase production environment variables are configured in the host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Firebase production environment variables are configured in the host:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
7. Firebase Auth is configured:
   - email link / passwordless provider enabled
   - production site URL allowlisted
8. Supabase migrations are applied before real users are invited.
9. `docs/release/SUPABASE_RLS_EVIDENCE.md` has been executed and evidence attached.
10. Manual smoke test confirms:
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
pnpm run build
pnpm dlx @playwright/test@1.54.2 install chromium
pnpm dlx @playwright/test@1.54.2 test
pnpm run preview
```

Open the preview and test every production route listed above.

---

## Auth / RLS Verification

Run the RLS runbook before production release:

- `docs/release/SUPABASE_RLS_EVIDENCE.md`

Required proof:

- RLS enabled on all protected tables.
- Owner policies exist for all protected tables.
- Protected app tables have `user_id` ownership columns.
- New `/auth` account creates a matching `profiles` row.
- Supabase security advisor has no unresolved production RLS issue.

---

## Known Production Risks Remaining

| Risk | Impact | Required Next Action |
|---|---|---|
| E2E workflow not yet confirmed green in this chat | Browser proof exists in repo, but latest run status was not returned by GitHub yet | Confirm `E2E Auth Gate` workflow passes |
| Supabase RLS not proven by live advisor output yet | Persistence/security depends on live database policies | Run `SUPABASE_RLS_EVIDENCE.md` and attach output |
| Large 3D bundle | May affect lower-end iPads | Add bundle analysis and code-split 3D chamber if needed |
| Manual deployment proof not attached | CI creates artifact but does not prove hosted preview health | Attach Vercel deployment URL and screenshots |

---

## Stop-Ship Conditions

The release must be blocked if any of these occur:

- GitHub Actions verification fails.
- E2E Auth Gate fails.
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

- [ ] GitHub Actions **Verify Vishvakarma.OS** workflow URL attached
- [ ] GitHub Actions **E2E Auth Gate** workflow URL attached
- [ ] `vishvakarma-os-dist` artifact attached
- [ ] Playwright auth-gate report attached
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
