# Vishvakarma.OS — cinematic welcome / loading slice
Date: 2026-11-19 (Australia/Perth)

## Source authority
- Base: main at `3bf5153c04f00a19fa12d2bb2551ea420a632363`.
- Source branch: `feat/vish-cinematic-welcome-loading-20261119`.
- Brand lock: `docs/BRAND_LOCK.md`; exact original swan image reused via `OFFICIAL_LOGO_SRC`.
- No changes to the original swan, deity photography, workspace canvas or auth/security gateways.

## Feature contract
1. Non-blocking first-paint opening splash with official swan and ambient gold light.
2. Illustrated 2D drawing-to-3D-house sequence on the welcome portion of sign-in. Illustration only, not a claim of real 3D project conversion.
3. Genuine route chunk suspense for welcome/auth uses an accessible indeterminate architectural loading state; no fake progress percentages.
4. Sign-in connection animation appears only during an existing in-flight Supabase auth submission.
5. CSS media preference disables continuous motion; no new animation library, video preload, tracking or third-party resources.
6. Signed-out users still use existing real Google SSO/email link paths; no auth bypass.
7. Preserve phone-first access: sign-in card remains before decorative hero on narrow screens.

## What is NOT proven
- No genuine installed-app, iPad, Fold, iPhone or server runtime capture is included in this change.
- Browser build/CI and end-to-end auth provider acceptance must be performed by a permitted runner.
- The main release remains blocked by existing security, domain and save/reopen acceptance issues documented in PR #208/#209.
- This branch is a reviewable source candidate only; do not claim a merged release or deployed feature.

## Proposed checks for an authorised runner
- `pnpm exec vitest run src/test/vishCinematicEntry.test.tsx src/test/officialLogoBrand.test.ts`
- `pnpm run lint:types`
- `pnpm run build`
- Browser: / → /auth; narrow Fold width, iPad landscape, iPhone portrait; reduced motion; offline/error; failing OAuth and email-link recovery. Record real screenshots and short actual navigation/sign-in-loading video with exact source SHA.
