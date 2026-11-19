# Vishvakarma.OS — S.I.R.E. evidence and UI inspection
**Date:** 19 November 2026, Australia/Perth.
**Evidence class:** inspected source/repo + read-only live browser navigation. NOT a full test run, screenshot recording, source-attested deployment, or release certification.
**Decision:** BLOCKED.

## Verified source identities
- Repository: https://github.com/brysonandtiff-ops/vishvakarma-os
- Default branch main at inspection: 3bf5153c04f00a19fa12d2bb2551ea420a632363.
- Existing recovery/repair: https://github.com/brysonandtiff-ops/vishvakarma-os/pull/208 — draft open; head 9823f2c2f6515de4de49a44ba6f6d987f9bfb010, 27 commits in PR at inspection.
- The Git repository root, not a retired vishvakarma-os-live nested wrapper, owns code, docs and migrations.
- Parent platform: S.I.R.E. AXIOM G.A.I.S. plugin 1.5.10 exists; real specialist execution, remote phone storage connection and live master-app deployment were not verified.

## Genuine browser evidence
- Cloudflare immutable-looking preview URL (no separate immutable build attestation): https://2a32718a.vishvakarma-os.pages.dev/
- Read-only browser QA run: https://agent.tinyfish.ai/runs/d6a9d0e5-c64d-4799-9c16-8ccbbe7b545c
- Public pages navigated: /, /features, /pricing, /terms. Navigation links to /auth, /editor-lite, /editor and /projects were observed but **not tested as full workflows in this run**.
- Observed: homepage draws correctly in the browser; top/footer navigation visible; public pages loaded without a reported blocking popup. Black/gold public design appears on preview.
- Public site exposes paid Studio/Enterprise pricing and Stripe terms; these are public UI observations, not proof of a live charge or approval to enable billing.
- Source artwork protected: docs/BRAND_LOCK.md identifies the official user-provided swan/V logo; **no original artwork changed**.
- The **correct active custom domain** https://vishvakarmaos.app and www version respond with page content, verified via Cloudflare zone/DNS/Pages API and external fetch. The obsolete hyphenated domain https://vishvakarma-os.app/ is DEACTIVATED and returned HTTP 404. Production exact-source attestation is not established.

## Signed-out 2D/3D route inspection (second genuine browser run)
- Date: 19 November 2026. Real browser run: https://agent.tinyfish.ai/runs/e6d5fa6b-2ad7-4a1b-9d3b-5b47b647cd0c
- Visiting `/editor` and `/editor-lite` redirects to `/auth` as a signed-out visitor. Login shows Google SSO, email magic-link request, a request-access option, a theme selector, audio widget and voice tour.
- **No interactive editor canvas or 3D walkthrough can be seen without sign-in.** The homepage's 2D/3D images are marketing previews, not genuine runtime test recordings. The browser did not authenticate or operate drawing tools.
- The access-gate redirect visibly worked; whether authenticated editor functionality, tenant permissions or payment entitlements work correctly remains **UNVERIFIED**.
- This run produced a browser task record but no shareable genuine UI screenshots or interaction video attachments. Such evidence is still required.

## Cloudflare evidence, current domain source of truth
Connected Cloudflare read-only query on 19 November 2026: zone vishvakarmaos.app ACTIVE; apex/www CNAME vishvakarma-os.pages.dev; Cloudflare Pages project vishvakarma-os identifies those real domains as ACTIVE and the hyphenated lookalike as DEACTIVATED. Exact deployed production source SHA cannot be matched to current Git main or #208/#209. Production branch is agent/cloudflare-pages-workers-migration; newest listed production attempt from August 5, 2026 failed, though earlier deployments succeeded. No DNS writes, billing, auth changes or production deployment were performed.

The repair candidate already has correct non-hyphen origins in runtime canonical origin and .env.example. Stale index.html social metadata and iPad test target are fixed in this docs/source cleanup. A content extractor exposed a CSS preload warning on the public site that browser navigation did not reproduce; must verify before concluding it is a release defect or fixed.

## Genuine public UI on active Cloudflare custom domain
Real read-only browser task at https://vishvakarmaos.app/: https://agent.tinyfish.ai/runs/de09b1e5-2d8e-422f-8ca2-738016632a9b. The homepage, Features and Pricing pages visually rendered with the original-branded site, intact images, dark/gold theme and navigation. A cookie/optional analytics banner appeared with Decline and Allow choices. No CSS-preload error was observed by that browser. Static 2D/3D hero images remain marketing previews, **not live editor runtime screenshots**. No signed-in app use, production build identity, physical hardware screen recording or interaction video was collected in this pass.

## Not tested, so not PASS
| Requirement | State | Missing proof |
| --- | --- | --- |
| Draw complete house (walls, openings, rooms, dimensions) | UNVERIFIED | Real pointer/stylus interaction, persistence after reload |
| Immediate accurate 2D-to-3D conversion | UNVERIFIED | Matching geometry/measurements and genuine runtime video |
| First-person walkthrough on supported devices | UNVERIFIED | Input, controls, frame performance, mobile fallbacks |
| Save, reopen, share | UNVERIFIED | Real signed-in isolated cloud or local recovery round-trip |
| Production auth/Supabase RLS and tenancy | BLOCKED | Live signed-in/tenant isolation and permission proof |
| Active non-hyphen custom domain | PARTIAL | Homepage responds; exact deployed source SHA/auth not attested. Old hyphen domain 404 |
| Security closeout | BLOCKED | Open issue #153 |
| Retained independently restorable encrypted backup | BLOCKED | Open issue #188 |
| Real iPad, Fold, iPhone screen/video proof | UNVERIFIED | Physical devices and complete reproducible media |
| Docs source-of-truth correction | CHANGE PROPOSED | Inspect this stacked PR; no CI/run claim |

## Historical evidence must remain historical
PR #208 describes 1,180 unit tests and local browser checks on earlier exact SHAs. Those are reports from the draft PR, **not tests rerun by this inspection**. This audit performed read-only repository/API and browser checks, not pnpm CI or signing into a real user account.

## Evidence Storage delivery
- Candidate S.I.R.E. Official App index path: sire-web/public/evidence-storage/index.json on SIRE branch feat/evidence-storage-vishvakarma-20261119.
- Save-to-phone option is explicit browser share/download of a dated JSON evidence entry, not authenticated direct Android folder sync.
- Intended owner Library: /Evidence Storage/Vishvakarma.OS/. Do not place secrets, private art or customer records into site public assets.
- Browser run link is a real inspection record; **no extracted runtime screenshot/video file is attached to this report**.

## Source/sign-off
This record is a dated S.I.R.E. audit prepared from authenticated GitHub metadata, public HTTP inspection and one real browser QA run. It does not confer a PASS for production, security or release. Review and re-check at the final deployed commit. No merges, DNS changes, cost-bearing storage operations or credential changes were made here.
