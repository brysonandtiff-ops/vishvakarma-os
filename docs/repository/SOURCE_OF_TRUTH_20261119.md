# Vishvakarma.OS — Source of Truth and Real-World Capabilities

**Audit snapshot:** 19 November 2026 · Australia/Perth

**Package:** 1.5.0

**Active public domain:** https://vishvakarmaos.app — serves an older source; not the latest development review

**Browser-tested Studio code:** `03e5fff1de7a9e5c78916a396e18e3cf5d7fbcaf`

**Release status:** BLOCKED. See the [local freeze and deployment evidence](../release/CURRENT_RELEASE_STATUS.md).

## The original idea

Turn an authentic hand-drawn house idea into a 2D architectural plan, inspect its 3D space, explore rooms, save and share. The owner-approved swan/V logo and original private concept art are protected by [Brand Lock](../BRAND_LOCK.md) and the [gift-design master](../design/ORIGINAL_GIFT_DESIGN_MASTER_2026-11-19.md).

**Important:** a real editor/scene source exists, but the latest complete signed-in home journey has not been independently operated on a physical iPad.

## Reality matrix

| Software area | Code / product source | Genuine proof | Not yet proved |
| --- | --- | --- | --- |
| Public pages | React routes for Home, Features, Pricing, legal | TinyFish public browser navigation | Newest source on live production |
| Sign-in | Approved Google SSO and existing-account magic-link UI | Real desktop layout, focus, error and navigation tests | Live new-account creation, OAuth, Supabase permissions |
| Projects and Studio | Projects library, real project actions, direct Atrium sample views | Local Chromium create, open, import, and reopen | Signed-in Projects operation |
| Blueprint | Walls, doors, windows, dimensions, snap/grid and history | Actual wall drawing in desktop and phone Chromium emulation | Physical iPad and stylus accuracy |
| 3D and Walk | React Three Fiber and Three.js views of the same manifest | Rendered geometry, native desktop pointer lock and touch movement | Physical-device video and complex plan parity |
| Save/reopen/export | Browser-local draft, Supabase and multi-format source | Saved, reopened and verified an exported JSON manifest in local Chromium | Signed-in cloud persistence, RLS, other formats on real devices |
| Governance | Spec, registry, change, release, audit, optimization routes | Source and selected build tests | Complete real user workflows and compliance accuracy |
| Welcome and voice | Public text tour, private cinematic source | Browser tour + focused audio lifecycle tests | Actual first-login cinematic and voice acceptance on iPad |
| PWA | Manifest, icons, service worker source | Manifest and icon presence / build precache | Real iPad installation and offline recovery |
| Payment | Stripe source and displayed prices | Public UI and focused contracts | Approved live checkout, billing, entitlements |
| Records | Internal self-verified record candidate | Dated source/status only | **NOT Guinness World Records certified** |
| Account admin | Prepared source SQL | Static source tests | No live admin grant or server migration verified |
| Hosting | Cloudflare Pages and active domain | Preview build and public site inspection | Latest review SHA in production |

**Evidence vocabulary:** “implemented” means source exists; “selected CI passed” covers only that named test selection; “browser inspected” means an actual observed UI action; “release-certified” requires security/backup/real account/device and source-matched acceptance.

## Source inventory and architecture

- Routes: src/config/routeManifest.ts and src/AppRoutes.tsx (21 route declarations including optional Pricing).
- UI: React 18 / TypeScript / Vite-Rolldown / React Router 7; src/ directory.
- Visuals: src/brand/officialLogo.ts and docs/BRAND_LOCK.md.
- 3D: src/components/editor/Viewport3D.tsx, Three.js and React Three Fiber.
- Auth/data: src/backend/supabase/ and supabase/migrations; external configuration must be checked separately.
- Billing: api/stripe/ and src/services/billing/; no payment action without explicit approval.
- Cloudflare build: scripts/cloudflare-build.mjs; the configured build proof is not full-repo certification.

## Evidence

- [Cloudflare preview](https://c8775cdc.vishvakarma-os.pages.dev/auth?next=%2Fprojects) from 614256d...: 312 selected tests / 50 files passed and deployment successful.
- [Public functional browser](https://agent.tinyfish.ai/runs/ef6afee9-a86d-44a3-9a2a-5f5dd92f2cd3).
- [Desktop/PWA browser](https://agent.tinyfish.ai/runs/7c4de896-fa79-48ab-806a-9a1015111b11).
- [Signed-out gates and 404 recheck](https://agent.tinyfish.ai/runs/20c54209-cd91-4da6-9e66-65d3111e7d00).
- [Final public sign-in visual](https://agent.tinyfish.ai/runs/be85892a-f431-4632-9eb8-72fa3a654896): 8/9 checks passed.
- [GitHub review PR](https://github.com/brysonandtiff-ops/vishvakarma-os/pull/210) and [current release decision](../release/CURRENT_RELEASE_STATUS.md).

S.I.R.E. AXIOM G.A.I.S. is the intended master command authority; documented team roles alone do not establish that a real executor ran. The private ChatGPT Library Evidence Storage is a separate archive and not proven Android folder synchronization.

**Stop-ship:** security issue #153, encrypted backup #188, real signed-in and physical-device verification, and owner release sign-off are outstanding. Track historic prose in [documentation debt](DOCUMENTATION_DEBT_20261119.md).
