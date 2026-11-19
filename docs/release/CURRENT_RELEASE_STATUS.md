# Vishvakarma.OS — Current release authority

**Inspected:** 19 November 2026 (Australia/Perth).
**Release decision:** **BLOCKED — NOT CERTIFIED**. A public preview loading is not a production release.
**Canonical repository:** brysonandtiff-ops/vishvakarma-os (repository root contains package.json, src/, docs/ and supabase/).
**Main source at inspection:** 3bf5153c04f00a19fa12d2bb2551ea420a632363.
**Existing repair PR:** #208, open draft; inspected head 9823f2c2f6515de4de49a44ba6f6d987f9bfb010. The repair PR base is sire/vish-recovery-evidence-20261030, not main.

## Verified read-only facts
- GitHub repository access and branch/PR metadata are reachable.
- Original swan/V logo and cream/ink/gold design are locked by docs/BRAND_LOCK.md; preserve original owner artwork.
- A live browser opened the Cloudflare preview at https://2a32718a.vishvakarma-os.pages.dev/ and navigated public Home, Features, Pricing and Terms pages. Run: https://agent.tinyfish.ai/runs/d6a9d0e5-c64d-4799-9c16-8ccbbe7b545c.
- Cloudflare DNS and Pages API confirm **https://vishvakarmaos.app** and **https://www.vishvakarmaos.app** are ACTIVE custom domains. Both respond with Vishvakarma.OS page content in fresh fetches. The deprecated hyphenated https://vishvakarma-os.app/ domain is DEACTIVATED and returned HTTP 404. Live page content is not proof of exact deployed SHA, auth or release certification.

## Signed-out UI gate check
Read-only browser run https://agent.tinyfish.ai/runs/e6d5fa6b-2ad7-4a1b-9d3b-5b47b647cd0c confirmed `/editor` and `/editor-lite` redirect visitors to `/auth`. This shows an apparent signed-out access gate, **not** verified signed-in editor function, real 3D rendering or signed-in Supabase RLS. Homepage previews are images, not interactive runtime proof.

## Stop-ship issues, not waived
1. Security incident #153 remains open: credential rotation, retained backup before history work, full history secret scan and gated repair are outstanding. No history rewrite without independent backup proof and owner approvals.
2. Repository backup #188 remains open: private R2 bucket preparation is not an independently recoverable, encrypted, retained Git backup. Its use may incur future charges; no storage writes are authorised by this document.
3. PR #208 remains a draft; signed-in tenant isolation, Supabase save/reopen, production casting and source-bound live deployment proof are not established by public-page navigation.
4. Stale hyphenated origin returns 404 and old references remain; the correct active non-hyphen custom domain responds, but exact deployment source/build, signed-in auth, CSS reliability and release certification are **unverified**. No DNS, deployment, key, billing or live-environment changes were performed.
5. Genuine physical iPad, Samsung Fold, iPhone and desktop acceptance, real interaction videos, screenshots with build identity and independent sign-off are outstanding.

## Verified Cloudflare domain configuration
- Cloudflare zone `vishvakarmaos.app` ACTIVE; apex and www proxied CNAMEs both point to `vishvakarma-os.pages.dev`.
- Pages project `vishvakarma-os` lists both non-hyphen custom domains ACTIVE. The hyphenated versions are DEACTIVATED. The domain links in older docs were stale.
- The Pages production branch is `agent/cloudflare-pages-workers-migration`, not current Git main or this PR; the newest listed production attempt (August 5, 2026) FAILED while older production deployments succeeded. Exact source commit serving the active custom domain has **not** been attested.
- Current repaired code already sets the correct non-hyphen origin in `src/config/canonicalOrigin.ts`, `scripts/lib/canonical-origin.mjs` and `.env.example`. This review repairs public metadata and iPad proof default URL. Live Supabase/Google/Stripe redirects, any support email deliverability, and CSS preload reliability need independent checks.

## Source-of-truth precedence
1. Exact Git source tree, package.json, migrations/configuration, and source-bound real runtime in the specific environment inspected.
2. Reproducible test logs, signed-in validation, immutable deployment/source receipts, screenshots/videos where appropriate, independently checked at the same candidate SHA.
3. Current signed-off owner design/art canon in docs/BRAND_LOCK.md. No generative replacement or style drift.
4. This release-status snapshot with its date, SHA and open holds.
5. Generated handoff inventories and historical product/release documentation; treat older PASS claims as historical unless re-run at the current candidate SHA.

## Required completion gates
- Security #153 closed with independent receipts; restore/backup #188 closed before any history rewrite.
- Agree and implement approved owner experience: draw an accurate 2D house with touch/stylus, turn it into an editable 3D house, explore in first person, save, fully reopen and securely share; see docs/design/OWNER_VISION_ACCEPTANCE.md.
- Real public + signed-in navigation/form/error recovery QA, 2D/3D interaction checks and accessibility tests on target devices.
- Supabase Auth/row permissions, storage isolation, export/import, consent, accessibility, offline/restore and performance proof; clarify any billing before enabling paid paths.
- Exact candidate source SHA equals immutable production deployed source, canonical domain serves the intended app, and independent reviewer approves release.
- Archive report, original test logs, actual screenshots/videos, device/browser IDs, SHA-256 hashes and no-cost/cost approvals in Evidence Storage.

No task owner, agent or specialist is claimed to be autonomously running merely because a role or work order is listed.
