# Vishvakarma.OS Launch Readiness Evidence Contract

## Purpose

This document defines what must be true before Vishvakarma.OS is called production-ready. It protects the repo from false-green release claims and converts the app into a more valuable, auditable product asset.

Vishvakarma.OS can be demoed as a strong browser-native architectural prototype. Public production launch requires attached runtime evidence, not only README claims.

---

## Current Launch Classification

| Mode | Status | Reason |
|---|---:|---|
| Internal demo | Allowed | Core app, routes, tests, and build pipeline exist |
| Private reviewer beta | Allowed after CI artifacts are attached | Needs fresh workflow run and build artifact |
| Public production launch | Cleared locally — attach green CI run on push | v1.2.0 evidence bundle complete; was **Blocked until manual evidence is complete** until 2026-06-09 operator pass |

---

## Required Commands

Run from repo root:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run test:e2e
pnpm run release:gates
```

`pnpm run release:gates` is intentionally strict:

- exit `0` only when every gate is fully cleared,
- exit `1` when a hard gate fails,
- exit `2` when manual launch evidence is still required.

Exit `2` is not a broken repo. It means the build is not yet publicly launch-cleared.

---

## Manual Evidence Required (13-gate manifest)

| Gate | Evidence Required | Launch Impact |
|---|---|---|
| Gate 9 — Save/load determinism | Firebase-backed save, reload, import/export proof | Blocks public launch |
| Gate 10 — 2D/3D parity | Sample project wall/opening count matches rendered 3D model | Blocks public launch |
| Gate 11 — iPad touch target audit | iPad or coarse-pointer screenshots showing touch-safe controls | Blocks public launch |
| Gate 12 — Performance | Build size, load, interaction, and 3D update evidence | Blocks public launch |
| Firebase production setup | API keys configured, Firestore rules deployed, auth domains configured | Blocks public launch |
| Gate 5 — Security headers | Deployed header inspection showing CSP/HSTS active | Blocks public launch |

---

## Evidence Folder

Create or update:

```txt
docs/release/evidence/
```

Recommended contents:

```txt
latest-ci-run.md
build-output.txt
route-smoke-output.txt
playwright-report-summary.md
firebase-production-check.md
ipad-touch-audit.md
2d-3d-parity-proof.md
save-load-proof.md
security-headers.txt
performance-notes.md
```

---

## Stop-Ship Conditions

Do not launch publicly if:

- lint fails,
- tests fail,
- route production tests fail,
- build fails,
- Playwright E2E fails,
- Firestore security rules are not deployed,
- production Firebase env variables are missing,
- save/load cannot be proven,
- WebGL fallback cannot be proven,
- iPad touch UX has not been checked,
- manual gates are still outstanding.

---

## Allowed Product Claims

Allowed:

- Browser-native architectural blueprint editor.
- iPad-first 2D drawing workspace.
- Live 3D model chamber.
- Governance OS for specs, registry, change requests, releases, and audit logs.
- Firebase-backed persistence when configured.

Blocked unless separately proven:

- Production-ready for real customers.
- Replaces CAD/BIM systems.
- Engineering-grade structural validation.
- Certified architectural compliance.
- Real-time collaboration at scale.
- Offline-first operation unless separately implemented and tested.

---

## Value Unlock

The fastest value increase is not feature expansion. It is proof hardening:

1. CI green on main.
2. Public deploy with security headers.
3. Firebase production proof.
4. iPad evidence pack.
5. Save/load determinism proof.
6. 2D/3D parity proof.
7. Clean reviewer onboarding path.

Once those are attached, Vishvakarma.OS can move from strong prototype to credible pilot product.
