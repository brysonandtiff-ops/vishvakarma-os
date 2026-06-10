# Operator Launch Checklist

Manual evidence required before public production launch. Automated CI covers gates 1–8 and 13; this checklist covers operator-only gates 9–12 plus deployment proof.

---

## Pre-Flight (Automated)

Run from repo root:

```bash
pnpm install --frozen-lockfile
pnpm run verify:ci
pnpm run test:e2e
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run release:gates
```

`release:gates` exit `2` means manual evidence is still outstanding — not a broken build.

---

## Firebase Production

- [x] `VITE_FIREBASE_*` set in Vercel production environment
- [x] Firestore security rules deployed (`firebase deploy --only firestore:rules`)
- [x] Authorized domain includes production URL
- [x] Email-link auth tested on production URL
- [x] Save → reload → geometry intact (attach proof to `docs/release/evidence/save-load-proof.md`)

Commands:

```bash
pnpm run production:verify-env --strict
pnpm run production:evidence
pnpm run test:firebase-auth              # quota-safe config check (no live email send)
```

**Auth deploy ritual:** After any `firebase deploy --only auth`, always run `pnpm run setup:firebase-auth` to restore passwordless email (`passwordRequired: false`). Prefer `pnpm run setup:firebase-auth:full` for email + OAuth deploys.

---

## Gate 9 — Save/Load Determinism

- [x] Create project on production, add 4 walls + 1 door + 1 window
- [x] Save, hard-refresh browser, reload project
- [x] Export JSON, import into fresh session — counts match
- [x] Attach screenshots + manifest hash to `save-load-proof.md`

---

## Gate 10 — 2D/3D Parity

- [x] Load sample project
- [x] Count walls and openings in status bar vs 3D viewport
- [x] Screenshot 2D canvas and 3D chamber side by side
- [x] Update `docs/release/evidence/2d-3d-parity-proof.md`

---

## Gate 11 — iPad Touch Audit

- [x] Physical iPad Air 2020 (or equivalent) in landscape — Playwright 1180×820 supplement PASS
- [x] Verify 44px touch targets on toolbar, ToolRail, Save, Export
- [x] Draw wall, place door, toggle 3D with touch only — automated E2E
- [x] Attach photos to `docs/release/evidence/ipad-touch-audit.md`
- [x] Playwright proxy: `e2e/ipad-production-readiness.spec.ts` (automated supplement)

---

## Gate 12 — Performance

- [x] Production load time < 5s on 4G throttled (DevTools)
- [x] 50-wall stress project: canvas interaction remains responsive
- [x] 3D toggle < 2s on sample project
- [x] Record notes in `docs/release/evidence/performance-notes.md`

---

## Cross-Browser Smoke

Automated via `pnpm run test:e2e:cross-browser` (Firefox + WebKit).

Manual supplement (optional):

- [ ] Safari macOS — editor save + 3D toggle
- [ ] Firefox — export PDF downloads correctly
- [ ] Chrome — baseline reference

---

## Security Headers (Gate 5)

- [x] Inspect deployed response headers for CSP and HSTS
- [x] Save output to `docs/release/evidence/security-headers.txt`

---

## Post-Launch (First 48 Hours)

- [ ] Monitor Sentry/error logs if DSN configured
- [ ] Check Vercel analytics for 5xx rate
- [ ] Collect one real-user feedback note
- [ ] Update `CHANGELOG.md` if hotfixes shipped

---

## Sign-Off

| Role | Name | Date | Gates cleared |
|------|------|------|---------------|
| Operator | Bryson Erdmann | 2026-06-09 | 9–12, Firebase, headers |
| Reviewer | Bryson Erdmann | 2026-06-09 | `release:gates:strict` exit 0 |

When all boxes are checked, run:

```bash
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

Public launch claim is allowed only after strict exit `0`.
