# Vishvakarma.OS — Production Readiness Evidence

**Status:** Release hardening added. Final production approval requires the GitHub Actions `Verify Vishvakarma.OS` workflow to pass on the release commit.

**Last updated:** 2026-05-21

---

## Release Gate Summary

| Gate | Required Proof | Status |
|---|---|---|
| Package identity | `package.json` name is `vishvakarma-os` and repository is private unless intentionally public | Added |
| Package manager lock | `pnpm-lock.yaml` is the source of truth and CI installs with `pnpm install --frozen-lockfile` | Added |
| Lint | `pnpm run lint` exits 0 | Enforced in CI |
| Unit tests | `pnpm run test` exits 0 | Enforced in CI |
| Production route smoke | `pnpm run test:routes` verifies all production routes are present, visible, unique, and renderable | Added and enforced in CI |
| Production build | `pnpm run build` creates `dist/` | Enforced in CI |
| Build artifact | CI uploads `dist/` as `vishvakarma-os-dist` | Added |
| Environment template | `.env.example` documents required Supabase variables | Added |
| Local-only safety | Missing Supabase env no longer creates an invalid production crash path | Added |
| Vercel SPA routing | Deep links rewrite to `index.html` | Added |
| Security headers | Baseline browser hardening headers configured in `vercel.json` | Added |

---

## Production Approval Rule

Do **not** mark a release as production ready unless all of these are true:

1. The latest commit on `main` has a passing GitHub Actions run named **Verify Vishvakarma.OS**.
2. The `dist/` artifact is present in that workflow run.
3. A deployed preview opens every production route:
   - `/`
   - `/spec-center`
   - `/registry`
   - `/change-requests`
   - `/releases`
   - `/audit`
4. Supabase production environment variables are configured in the host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Manual smoke test confirms:
   - editor loads
   - local-only mode displays safely when Supabase is absent
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

## Known Production Risks Remaining

| Risk | Impact | Required Next Action |
|---|---|---|
| No full browser E2E suite yet | Route manifest is checked, but user flows are not fully browser-driven | Add Playwright route open + editor smoke tests |
| Supabase RLS not proven in this evidence pack | Persistence/security depends on live database policies | Add Supabase advisor output and RLS policy proof |
| Large 3D bundle | May affect lower-end iPads | Add bundle analysis and code-split 3D chamber if needed |
| Manual deployment proof not attached | CI creates artifact but does not prove hosted preview health | Attach Vercel deployment URL and screenshots |

---

## Stop-Ship Conditions

The release must be blocked if any of these occur:

- GitHub Actions verification fails.
- Supabase production env values are missing for a persistence-backed release.
- Any production route renders a blank page.
- WebGL failure crashes the whole app instead of degrading gracefully.
- `pnpm install --frozen-lockfile` fails.
- `pnpm run verify:ci` fails.

---

## Evidence Checklist

- [ ] GitHub Actions workflow URL attached
- [ ] `vishvakarma-os-dist` artifact attached
- [ ] Vercel deployment URL attached
- [ ] Screenshots for all six production routes attached
- [ ] Supabase environment configured in host
- [ ] Supabase RLS/advisor evidence attached
- [ ] Manual iPad/tablet smoke test recorded
- [ ] Known risks either fixed or explicitly accepted
