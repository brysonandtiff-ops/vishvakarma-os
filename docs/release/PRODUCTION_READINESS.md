# Vishvakarma.OS — Production Readiness Evidence

**Status:** v1.2.0 release hardening complete locally. Firebase-only runtime on Vercel. Final public launch requires green GitHub Actions on the release commit.

**Last updated:** 2026-06-09

---

## Release Gate Summary

| Gate | Required Proof | Status |
|---|---|---|
| Package identity | `package.json` name is `vishvakarma-os` | PASS |
| Package manager lock | `pnpm-lock.yaml` + `pnpm install --frozen-lockfile` | PASS |
| Lint | `pnpm run lint` exits 0 | PASS locally + CI |
| Unit tests | `pnpm run test` exits 0 (461 tests) | PASS locally |
| Production route smoke | `pnpm run test:routes` | PASS |
| Browser auth E2E | Playwright `/auth` + private route redirect | PASS locally |
| Production build | `pnpm run build` creates `dist/` | PASS |
| Build artifact | CI uploads `dist/` as `vishvakarma-os-dist` | PASS locally |
| Passwordless account access | `/auth` uses Firebase email-link | PASS |
| Data persistence | Firestore via `src/backend/firebase/` | PASS |
| App route guard | Private routes redirect when signed out | PASS |
| Account shell controls | Session mode + sign-out in AppLayout | PASS |
| Profile creation | Firebase auth + profile context | PASS |
| Firestore rules | `firestore.rules` deployed to production project | PASS per operator checklist |
| Environment template | `.env.example` documents `VITE_FIREBASE_*` | PASS |
| Export format limits | `docs/user/EXPORT_LIMITATIONS.md` | PASS |
| Stub tool roadmap | `docs/user/STUB_TOOLS.md` | PASS |
| Release screenshot pack | Page references + Playwright captures | PASS |
| Vercel production env | `docs/release/VERCEL_ENV.md` | PASS |
| Vercel SPA routing | Deep links rewrite to `index.html` | PASS |
| Security headers | `vercel.json` + live CSP/HSTS | PASS |

---

## Production Approval Rule

Do **not** mark a release as production ready unless all of these are true:

1. The latest commit on `main` has passing GitHub Actions runs named **Verify Vishvakarma.OS** and **E2E Auth Gate**.
2. The `dist/` artifact is present in the verify workflow run.
3. The Playwright report is attached or inspected for the E2E workflow run.
4. A deployed preview opens every production route (31 routes per `PAGE_REFERENCE.md`).
5. Firebase production environment variables are configured in Vercel:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
6. Firebase Auth is configured:
   - email link / passwordless provider enabled
   - production site URL allowlisted (`vishvakarma-os.vercel.app`)
7. Firestore rules deployed: `firebase deploy --only firestore:rules`
8. Manual smoke test confirms:
   - `/auth` loads while signed out
   - signed-out users cannot access private app routes in production
   - account creation/sign-in email link reaches the configured site URL
   - editor loads after sign-in
   - save → hard refresh → reload preserves geometry
   - account/sign-out controls are visible in the app shell
   - 2D editor remains usable if WebGL is unavailable
   - governance pages render without blank screens

---

## Local Verification

```bash
pnpm install --frozen-lockfile
pnpm run verify:ci
pnpm run test:e2e
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run release:gates:strict
pnpm run launch:evidence:strict
pnpm run build
pnpm run preview
```

Open the preview and test every production route listed in `docs/design/page-references/PAGE_REFERENCE.md`.

---

## Auth / Firestore Verification

Run before production release:

- `docs/release/evidence/firebase-production-check.md`
- `pnpm run production:verify-env`
- `pnpm run setup:firebase-auth` (operator)

Required proof:

- Firestore rules restrict user-owned project documents.
- New `/auth` account can sign in via email link.
- Cloud save/load round-trip on production URL.

---

## Known Production Risks Remaining

| Risk | Impact | Required Next Action |
|---|---|---|
| Prior CI run failed on stale unit test | Remote proof outdated | Push fix commit; attach green Actions URL |
| Large 3D bundle | May affect lower-end iPads | 3D vendor chunk isolated; monitor Gate 12 |
| Export formats not CAD-grade | PNG/PDF are demo outputs only | See `docs/user/EXPORT_LIMITATIONS.md` |
| Stub tools in rail | Room/Vastu/MEP show toast only | See `docs/user/STUB_TOOLS.md` |
| Collaboration UI | Preview only — not real-time at scale | Features page marks as v2 |

---

## Stop-Ship Conditions

The release must be blocked if any of these occur:

- GitHub Actions verification fails.
- E2E Auth Gate fails.
- Firebase production env values are missing for production release.
- Firebase Auth email-link flow is not configured.
- Firestore rules are not deployed.
- Any private production route is reachable while signed out.
- Any production route renders a blank page.
- WebGL failure crashes the whole app instead of degrading gracefully.
- `pnpm install --frozen-lockfile` fails.
- `pnpm run verify:ci` fails.

---

## Evidence Checklist

- [x] Local `pnpm run verify:ci` green (2026-06-09)
- [x] Vercel deployment URL attached — https://vishvakarma-os.vercel.app
- [x] Live security headers captured — `security-headers.txt`
- [x] Firebase production check — `firebase-production-check.md`
- [x] Save/load proof — `save-load-proof.md`
- [x] 2D/3D parity proof — `2d-3d-parity-proof.md`
- [x] iPad touch audit — `ipad-touch-audit.md`
- [x] Performance notes — `performance-notes.md`
- [ ] GitHub Actions **Verify Vishvakarma.OS** workflow URL (green on release commit)
- [ ] GitHub Actions **E2E Auth Gate** workflow URL (green on release commit)
- [ ] Export limitations acknowledged in marketing copy audit
- [ ] Physical iPad Safari Home Screen install (recommended supplement)
