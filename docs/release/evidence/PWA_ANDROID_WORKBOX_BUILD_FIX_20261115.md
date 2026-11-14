# Vishvakarma.OS — Android Workbox PWA build repair

**Reviewed:** 15 Nov 2026 (Australia/Perth).
**Scope:** Existing draft PR #208, branch `codex/production-readiness-20261113`. Starting remote SHA `300a8a2454e9978034d3a2674bcdcbc493da7ccc`.
**Release:** **HOLD**. This evidence is local Android compilation proof, not Cloudflare production or physical-browser acceptance.

## FIND — real root-cause reproduction

Vite/React bundled the application, printed a successful compile line, but the PWA generator did not write `dist/sw.js` and the build did not complete. The source uses VitePWA 1.3.0 with Workbox 7.4.1.

Isolated on the owner's Android 17 Termux Node v24.17.0:

- Standalone Workbox `generateSW({mode:'production'})` — exit **1** with the actual error:
  `Unexpected early exit. This happens when Promises returned by plugins cannot resolve. Unfinished hook action(s) on exit: (terser) renderChunk`.
- Same real Workbox `generateSW({mode:'development'})` — exit **0**, generated 156 precache items and complete service-worker file.

This is an Android/Termux `@rollup/plugin-terser` worker/minifier compatibility failure, not evidence that the application source or Cloudflare/Linux SW build is broken.

## PLAN + FIX — platform-scoped, production preserved

- `config/workboxBuildMode.ts` selects `development` **only** for `process.platform === 'android'`; every other platform including Cloudflare/Linux uses `production`.
- `vite.config.ts` retains the real `VitePWA` plugin, original cache entries, runtime-caching rules, `skipWaiting`, `clientsClaim`, size limits, update policy, service-worker generation and PWA manifest settings.
- `disableDevLogs: true` suppresses Workbox runtime development log noise. The Android-generated service worker is non-minified, for local testing only.
- `src/test/workboxAndroidBuildMode.test.ts` tests Android mode, Linux/macOS/Windows/FreeBSD production mode and preservation of PWA features.
- No dependency installation, production runtime/CDN switch, weakened protected release tests or bypass of any security/approval gate.

## PROVE — observed commands / logs

- Initial full Android PWA build after the inline compatibility fix: `pnpm run build` exit **0**, Vite compiled and VitePWA reported `generateSW`, generated `dist/sw.js` and `dist/workbox-25613826.js`.
- Final full Android PWA build after extracting the pure mode selector: `pnpm run build` exit **0**; Vite `built in 6.91s`, PWA `generateSW`, **156 precache entries**, `dist/sw.js` and `dist/workbox-25613826.js` generated.
- The generated SW SHA-256: `0ac34afa68dfc44b29baf96e885afd4f26bd04381dce29e27c38a5573573bab6`.
- `pnpm run perf:gates`: exit **0**; bundle budget passed; PWA precache **156 entries, 11.08 MB**, under limits.
- `node scripts/security/check-dist-security.mjs`: exit **0**, **296 build files scanned**; no scanned secret, source-map, service-role JWT or QA leakage.
- Targeted Vitest across existing PWA, release, Cloudflare and new mode tests: **48/48 passed**, 9 files, exit **0**.
- `pnpm run lint:types`: exit **0**.
- `git diff --check`: exit **0**.
- Full 1,197-test run belonged to the preceding hosting-source revision with other local changes; it is not claimed as independent exact-SHA proof for this patch.

Local evidence log hashes (retained under ignored `.local-proof/pwa-diagnostic-20261115/`):
- `final-android-build.log`: SHA-256 `3c0899eeb8427e4d8076a3b0e4a11301aa1f03eb55fb116a0b1b85ed6c72abf9`
- `compat-targeted.log`: SHA-256 `c44ef429b6adfc88f83eb6a39ab97f5f94367d834b0081d2bf8f5f40e4716c68`
- `compat-typecheck.log`: SHA-256 `898db6ad0138c0594ec3331c7d11bd270a26ee1aea395a0971ffc48fa870b453`
- `final-perf.log`: SHA-256 `a1959c909964944c99441b46f9a53161c7db7b7462da9a8805443656bc1a7429`

## FINISH — remaining holds, not simulated

1. **Production must remain on HOLD.** Existing Cloudflare production at `https://vishvakarmaos.app` serves 5 Aug 2026 source `5a1305928ca9435e577ea2e021935452f9289a02`; the newer source is not live.
2. Security incident **#153 OPEN**: password, potentially live Stripe key, offline/mirror backup, full-history credential purge and re-cloning require separate authorized key custody and owner action. A retired-host token was removed from tracked VS Code settings in the previous PR commit; **revocation and historical purge are still NOT VERIFIED**.
3. Recovery **#188 OPEN**: Cloudflare's private R2 bucket `vishvakarma-os-recovery-private` was read-only inspected; **zero objects** at review. No encrypted retained backup or restore evidence exists. No upload, credential/key generation, cost, history rewrite or destructive Git action was performed.
4. No genuine live Samsung screen/video, 2D-to-3D signed-in persistence, physical touch interaction, OAuth RLS, complete browser QA or production Linux build is certified by this local Android-specific fix.
5. Previous uncommitted Welcome and 3D-walk UI work is intentionally excluded from this PWA compatibility change; it must receive independent proof. GitHub PR #208 remains draft and unmerged.

**Git safety:** only explicitly reviewed PWA code, its focused tests and this proof file may be included in the follow-up commit on the existing PR branch. Use `[CF-Pages-Skip]` to prevent automatic Cloudflare Pages builds. No main changes, new PR, merge, release, paid Actions or Cloudflare deploy.

**Rollback (future authorized operation):** inspect and revert only this isolated PWA compatibility commit on the same existing branch; preserve unrelated dirty UI work and all issue records. Do not reset or force-push the entire repository.
