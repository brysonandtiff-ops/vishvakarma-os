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
- Canonical production target https://vishvakarma-os.app/ returned HTTP 404 on this inspection. A preview is not proof of the production DNS, build SHA, backend or release gate.

## Stop-ship issues, not waived
1. Security incident #153 remains open: credential rotation, retained backup before history work, full history secret scan and gated repair are outstanding. No history rewrite without independent backup proof and owner approvals.
2. Repository backup #188 remains open: private R2 bucket preparation is not an independently recoverable, encrypted, retained Git backup. Its use may incur future charges; no storage writes are authorised by this document.
3. PR #208 remains a draft; signed-in tenant isolation, Supabase save/reopen, production casting and source-bound live deployment proof are not established by public-page navigation.
4. Canonical origin is HTTP 404. No DNS changes, production deployment, key rotation, billing activation or release promotion were performed.
5. Genuine physical iPad, Samsung Fold, iPhone and desktop acceptance, real interaction videos, screenshots with build identity and independent sign-off are outstanding.

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
