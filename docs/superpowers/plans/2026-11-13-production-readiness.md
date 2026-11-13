# Production Readiness Integration Plan

**Goal:** Preserve both current repair branches in one tested launch candidate and identify the remaining production blockers from live evidence.

**Architecture:** Integrate the current recovery branch (`0a1d3266b6c9729611665db9f012412a8a90a64f`, PR #198) with the repair stack (`9774388d5e6228d48bedc8e8f4b8fee7f4f6258c`, PR #205). Keep Cloudflare Pages/Functions and Supabase as the runtime architecture. Source integration does not establish production certification.

**Tech Stack:** React, TypeScript, Vite, pnpm 9.15.0, Vitest, Playwright, Cloudflare Pages/Functions, Supabase.

**Spec:** `AGENTS.md`, `docs/release/CLOUDFLARE_PRODUCTION_CERTIFICATION.md`, `docs/release/evidence/SIRE_VISH_RECOVERY_EVIDENCE_20261030.md`.

## Constraints

- Preserve both branches' regression coverage, phone layouts, CSP-compatible splash, MFA/session checks, cast controls, and save/load evidence guards.
- Preserve security incident #153 and all backup, credential, authentication, RLS, hardware, and independent approval gates.
- Do not rotate credentials, rewrite history, alter billing, change DNS delegation, merge into production, or promote a deployment as part of source integration.
- Use existing source history and an isolated branch. Do not overwrite either draft branch.
- Report local/browser verification separately from live authenticated and physical-device proof.

## Review Focus

- Sign-out or account switching during MFA verification must not grant private access.
- Cast controls must remain available during presentation lock.
- Browser startup must remain interactive under the deployed CSP.
- Missing cloud-save or reload proof must not become PASS.
- Integration must retain all focused production regression tests from both branches.

## Tasks

- [x] Identify exact source candidates, divergence, and live production/service state.
- [x] Merge the repair stack locally; resolve the startup regression-test conflict while retaining both assertions and remove the duplicate focused-test entry.
- [x] Run locked dependency installation, typecheck, full unit tests, Cloudflare configuration/source/artifact guards, production build and performance gates.
- [x] Run relevant browser checks for startup, private-route protection, editor drawing/export, cast controls, and phone layouts; report unavailable live proof explicitly.
- [x] Obtain independent integration review and address material findings with regression checks.
- [ ] Record exact candidate state and the remaining operator/provider blockers; ship only the isolated candidate if checks and available repository authentication permit it.

## Execution Notes

2026-11-13: Proceed with source integration and independent review under the user's production-launch request. A new checkout and branch provide isolation. Existing repairs and tests are retained rather than reimplemented. No new feature design is required.

The public canonical URL returned HTTP 404 `DEPLOYMENT_NOT_FOUND`. Supabase management metadata reports `ACTIVE_HEALTHY`, but database and advisor reads failed; those responses do not establish working sign-in or persistence. Historical claims of `INACTIVE` are not treated as current facts.

Final source verification: 1,180 unit tests, all 10 `verify:ci` stages, three deep-editor browser checks, 21 auth/layout checks, and 53 app browser checks passed. Two app checks were explicitly skipped for disabled pricing and missing authenticated casting fixtures. New regression coverage fixes verified SDK identity after legacy snapshot removal, local E2E isolation, mode-bound route protection, cast connection ownership, and responsive touch-target sizing. Live launch holds remain unchanged; see `docs/release/evidence/PRODUCTION_LAUNCH_REVIEW_20261113.md`.
