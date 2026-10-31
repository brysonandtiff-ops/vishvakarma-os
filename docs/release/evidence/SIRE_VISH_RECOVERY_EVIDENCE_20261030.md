# Vishvakarma.OS — S.I.R.E. recovery evidence — 30 Oct 2026

Status: 🟡 PARTIAL — recovery branch only, not production certification.

## Why this branch exists

A cloud test session on 30 October 2026 reported a green candidate with:

- 1,274 unit tests across 209 files passing.
- all 10 local verification stages passing.
- 160 local-browser checks passing.
- 39 production-mode browser checks passing.

However, the exact temporary workspace containing those repairs was not preserved as a commit SHA before the session ended. Under S.I.R.E. proof rules, those results MUST NOT be promoted as exact-SHA certification.

This branch therefore starts from the latest preserved integrated source commit:

`b9cbc2b8b2b219ee9c239101121c506303669942`

It records the recovery boundary without changing `main` or production.

## Repairs observed in the temporary test workspace

The session reported targeted fixes for:

- project storage recovery and malformed project records;
- duplicate/invalid project identity guards;
- SVG export escaping and invalid imported numeric/annotation data;
- Terms and Privacy routes;
- signed-out route protection checks;
- mobile/touch canvas redraw scheduling;
- Voice Tour clipping and floating-control overlap;
- casting status / End cast controls during presentation lock;
- header touch target sizing and overflow navigation;
- consent and onboarding overlay interactions;
- command-palette and demo-navigation test drift.

These items are evidence of work performed in the temporary workspace, not proof that this recovery branch contains every one of those source changes.

## External state rechecked

- Supabase project `jyocvwipthswfcmvqgqe` reported `ACTIVE_HEALTHY` on 30 October 2026.
- Cloudflare Pages and the read-only preview Worker were reported reachable during the session.
- `vishvakarma-os.app` still returned HTTP 404 during the final live recheck.

## Promotion rule

Do not merge or deploy this branch as the repaired application.

Required next proof:

1. Reconstruct/reapply the temporary repairs onto this branch from preserved source evidence.
2. Run the smallest focused tests for each reconstructed repair.
3. Run the full unit/type/build/bundle/PWA pipeline.
4. Run the full browser suite.
5. Freeze the resulting exact SHA.
6. Re-run required gates on that exact SHA.
7. Prove signed-in create → 2D edit → 3D → cloud save → reload → export.
8. Prove physical Fold/iPad behaviour separately.
9. Fix and verify the custom Cloudflare domain.
10. Only then consider promotion.

## Authority boundary

Git is used only as source history and review transport here. GitHub Actions is not accepted as the testing/deployment authority. Cloudflare/S.I.R.E. evidence remains the required execution path.

No production deployment, merge, billing change, database mutation, or domain cutover is authorised by this evidence note.
