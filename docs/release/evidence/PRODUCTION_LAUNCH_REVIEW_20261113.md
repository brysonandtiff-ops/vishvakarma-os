# Production launch review — 13 November 2026

**Launch state: BLOCKED.** Source integration and local verification are not production certification.

## Source candidate

The integration preserves both existing repair histories:

- PR #198 recovery branch: `0a1d3266b6c9729611665db9f012412a8a90a64f`.
- PR #205 repair stack: `9774388d5e6228d48bedc8e8f4b8fee7f4f6258c`.

Additional repairs cover MFA assurance after same-account session replacement, cast controls and shared-session ownership, empty-target import verification, deployed-source provenance, current route/API inventory generation, responsive header touch targets, local-test backend isolation, production route protection, and obsolete browser-test selectors. Cloud project, optimization and material-upload gateways now obtain verified identity from the Supabase SDK instead of the removed legacy session snapshot. The enclosing commit identifies the source candidate; rerun checks on that exact commit before promotion.

## Live observations

| Surface | Observation on 2026-11-13 | Consequence |
| --- | --- | --- |
| `https://vishvakarma-os.app` | HTTP 404, `DEPLOYMENT_NOT_FOUND` from Vercel | Canonical production is unavailable. |
| Authoritative DNS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com`; registrar Name.com | Prepared Cloudflare DNS records are not authoritative. |
| Cloudflare zone | Pending; assigned `lily.ns.cloudflare.com`, `noel.ns.cloudflare.com` | Apex/www Pages custom domains are deactivated. |
| Pages production | `5a1305928ca9435e577ea2e021935452f9289a02`, August 5 | This is not the integrated candidate. |
| Latest existing preview | `d20fc50c.vishvakarma-os.pages.dev`, source `0a1d3266b6c9729611665db9f012412a8a90a64f` | Landing/deep routes return 200, but `/api/health` returns 503. |
| Preview runtime configuration | Server secret binding exists; `SUPABASE_URL` is absent | Reconcile the intended backend and secret before a new deployment. A presence-only green health check would not prove database access. |
| Supabase project `jyocvwipthswfcmvqgqe` | Management metadata `ACTIVE_HEALTHY`; database reads fail authentication and advisors report hibernation | Historical `INACTIVE` claims are stale, but functional auth/database/RLS readiness is still unverified. |

The Name.com delegation cannot be changed through the connected Cloudflare account. No nameserver cutover or production promotion was performed.

## Mandatory launch holds

1. [Security incident #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153) remains open. Private credential triage/rotations, retained recovery evidence, historical remediation and clean rescans must be completed and verified. Current-source secret scanning does not clear historical detections.
2. [Recovery backup #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188) remains open. A private R2 bucket exists; owner-held recovery-key custody, a retained encrypted archive and independent decrypt/restore have not been verified. Do not rewrite history without the retained recovery boundary.
3. [Provider recovery #137](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/137) and [authenticated workflow #190](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/190) need real sign-in, signed-in create/edit/save/reload/export/import, session restoration, and distinct-tenant RLS proof on the frozen deployment.
4. [Branch protection #177](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/177), physical-device acceptance and independent release approval remain separate requirements.
5. After the incident and runtime gates clear, complete the approved domain migration at Name.com, preserving the complete DNS zone, and verify the canonical domain against the exact approved deployment.

The certification command was run against the existing preview and correctly exited 2 at the open #153 preflight. No launch evidence was upgraded from API-only, local-demo, missing, or stale-deployment results.

Browser save/load evidence now requires a fresh authenticated Cloudflare deployment lookup matching the exact source SHA and immutable preview origin. Canonical/branch aliases and direct-upload deployments are deliberately held by this attestation path. Canonical-domain HTTP checks remain separate; the preview receipt cannot certify a different origin. Credentials for this read belong in the secure process environment, never in the repository or chat.

## Verification scope

Final local `verify:ci` completed all 10 stages, including application/API typechecks, lint, contracts, static schema checks, **1,180 unit tests across 211 files**, seven route smoke checks, production build and bundle/PWA budgets. RepairBot medium passed. Source and emitted-artifact secret/QA-leak guards passed, with 298 emitted files scanned. Documentation and handoff verification passed; all 16 changed JavaScript files passed syntax checks. Independent source review reported no remaining blocking findings in the repaired scope.

The browser auth harness passed 21 signed-out route/layout checks. The editor deep-proof suite passed all three checks: wall/door/properties, tool selection and loading demo geometry. The rebuilt isolated app browser suite passed **53 checks with two explicit skips**: pricing is disabled, and casting needs a saved authenticated presenter fixture. It verifies the corrected 44px controls, Undo, 3D toggle, device layouts, local save and profile sign-out. These are local checks; they are not live Google OAuth, cloud persistence, physical iPad/Fold, or production casting evidence.

Final verification results and the exact committed source state must be reported alongside this review. Retain the separate failures/limitations instead of describing a locally green candidate as launched.
