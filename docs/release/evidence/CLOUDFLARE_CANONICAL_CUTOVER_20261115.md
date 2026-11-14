# Vishvakarma.OS — Cloudflare-Only Origin and Git Proof

**Observed:** 15 November 2026 · **Stage:** Git repair candidate, not deployment or certification.

## Authenticated provider evidence

Read-only Cloudflare API on the owner's account confirmed:

- Active custom domain: **https://vishvakarmaos.app**.
- Active WWW domain: **https://www.vishvakarmaos.app**.
- Zone: `vishvakarmaos.app`; active proxied apex and WWW DNS records are CNAMEs to `vishvakarma-os.pages.dev`.
- Pages project: `vishvakarma-os`, GitHub source `brysonandtiff-ops/vishvakarma-os`.
- Pages configured production branch: `agent/cloudflare-pages-workers-migration`.
- Pages build: `node scripts/cloudflare-build.mjs`; output `dist`.
- Domain active/live: root, `/auth`, `/editor`, `/3d-room`, `/og-card.png`, `/api/health` returned HTTP 200. This proves reachability, not signed-in correctness.
- Last successful **production custom-domain artifact** was an older release: **5 August 2026**, deployment `3d003e50`, Git SHA `5a1305928ca9435e577ea2e021935452f9289a02`.
- Latest successful reviewed **preview** (not production) was **13 November 2026**, https://2a32718a.vishvakarma-os.pages.dev, Git SHA `5c66a6604706282e0668c2b07d7a395e2d8570b7`.
- Older hyphenated .app URL returned HTTP 404 and the Pages custom-domain registry marked it deactivated.

**Production is on HOLD:** GitHub security incident #153 and retained-backup issue #188 were both OPEN when checked. Authentication, provider redirects, RLS isolation, real phone rendering and source SHA of an updated live artifact remain unverified.

## Source corrections — existing PR #208 branch only

Base local HEAD before this candidate: `5c66a6604706282e0668c2b07d7a395e2d8570b7` on `codex/production-readiness-20261113`.

- Replace active canonical origins in auth, release security, Supabase local config, environment examples, metadata and test expectations with **https://vishvakarmaos.app** (and active WWW where explicitly allowed).
- Remove obsolete hosting origins from the collaboration WebSocket allowlist without broad wildcard exceptions.
- Eliminate obsolete operational hosting instructions; document current Cloudflare Pages build/source, exact production vs preview deployment evidence and remaining HOLDs.
- Expand the Cloudflare-only operational-source guard to inspect the collaboration server, tracked editor configuration, active templates and operator guidance.
- Remove a tracked **legacy-host access-token field** from VS Code settings. Token value is intentionally **not copied into proof**.
- Retain original historical incident/release/rollback evidence, even where it mentions former infrastructure; do not rewrite Git history, mass-delete archives or falsify historical attestations.
- Keep the previously uncommitted Welcome-screen and 3D-walk improvements **unmodified and outside the hosting-fix commit** until separate real-device review.

## Fresh candidate checks

Run in existing Android Termux checkout with no paid runner:

- `pnpm exec vitest run` across 7 named Cloudflare, auth, host and UI test files: **54 / 54 PASS** after correcting a case-sensitive test assertion.
- `pnpm run lint:types`: **PASS**, exit 0.
- `node scripts/quality/check-cloudflare-only.mjs`: **PASS**, scanned 1,070 operational text files.
- `node scripts/quality/check-auth-config-guard.mjs`: **PASS**; prints new canonical origin.
- `git diff --check`: exit 0.
- These checks provide **source and configuration evidence**. They do not certify a complete PWA build, browser runtime, OAuth/provider configuration, production RLS or device acceptance.

The prior full local PWA build timed out after generating chunks. A separate PWA-disabled diagnostic build completed, but is not acceptable release proof. S.I.R.E. has no registered native proof runner; no agent/task/clip was invented.

## Git and Cloudflare safety

Cloudflare's official GitHub integration documents the `[CF-Pages-Skip]` **commit-message prefix** as a way to skip a single Pages deployment. Use that prefix for this non-production Git repair; never change the production branch, DNS, provider tokens, or Cloudflare Pages settings to publish the candidate.

Local identity must be grounded in the authenticated GitHub account; do not set a global Git identity for this task. Preserve other files, drafts and PRs. Do not force push, merge, use paid Actions, or certify an untested build.

## Remaining concrete blockers

1. **Revoke the potentially exposed legacy access token in its original service.** Removing its tracked source field does not revoke it or purge existing Git history. Sensitive bytes must not be reproduced in logs or PR descriptions.
2. Align actual live Cloudflare/Supabase/Google OAuth/Stripe provider settings with the new domain **only through independently authorized secure procedures**. Source edits alone do not change live provider settings.
3. Investigate full PWA build finalization and prove exact-source browser/app behavior.
4. Keep #153 and #188 in HOLD until actual evidence resolves them.
5. Obtain owner visual proof and tick for Screen 01 and downstream rooms.

**Rollback:** Changes are scoped to explicit hosting and operator files. Review the precise commit before any authorized revert; never reset or clean another owner's uncommitted work.


## Independent full-suite recheck after fixing documentation contract

- First complete unit run: 1,195/1,197 pass, two documented contract-string failures in `releaseGateHardening.test.ts` and `verificationWiring.test.ts`; these checked the expected exact wording that GitHub certification `does not deploy production`. No existing test or assertion was removed.
- The actual GitHub certification README was corrected to accurately preserve that policy phrase. Focused recheck: **12/12 passed**.
- Second full unit run: **1,197/1,197 PASS across 215 files, exit 0**, source checkout before commit still `5c66a6604706282e0668c2b07d7a395e2d8570b7`.
- The two pre-existing performance-overhaul proof files auto-modified by the broad tests were restored **exactly** from their pre-test HEAD bytes after the suite finished; they are excluded from this hosting source patch.
- Repo secret scanner, documentation verifier, production-hardening source gate, TypeScript type checks and 54 targeted tests separately passed.
- Current host change still **not live-OAuth or device acceptance**; production promotion and Pages builds remain HOLD.
