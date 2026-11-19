# Vishvakarma.OS — Documentation and Evidence Standards

**Reviewed:** 19 November 2026 · **Version:** 1.5.0 · **Audience:** developers, operators and reviewers

Documentation must be exciting to read and **precisely truthful**. Do not promote a source module, historical test, marketing claim or static image into a verified software feature.

## Source-of-truth hierarchy

1. Actual checked-out Git source, package.json, src/config/routeManifest.ts, src/AppRoutes.tsx, real backend migrations and build configuration **at the exact claimed SHA**.
2. Genuine source-matched build/test receipts, browser operations, physical-device video/screenshots/audio, live provider checks and independent reviewer evidence.
3. [Current release decision](./release/CURRENT_RELEASE_STATUS.md) and [review ledger](./release/evidence/REVIEW_VERIFICATION_LEDGER_20261119.md) for their stated audit date, not automatically for later commits.
4. [Human-approved visual art lock](./BRAND_LOCK.md), original design reference and its integrity fingerprint.
5. Current user/developer/operator guides and [source reality matrix](./repository/SOURCE_OF_TRUTH_20261119.md).
6. Historical release/valuation packs, snapshots, older appendices, prototypes and future plans. Preserve them with banners; they cannot override current evidence.

## Evidence vocabulary

- **VERIFIED:** genuine operation in the stated environment and exact source.
- **IMPLEMENTED / UNVERIFIED:** code exists or tests are selected, but the real feature is unproven.
- **BLOCKED:** a necessary security, provider, device or recovery gate is unresolved.
- **HISTORICAL:** an old report or build; retain its original facts and dates.
- **PLANNED:** approved intention or specification, not existing behaviour.
- **UNKNOWN:** missing or contradictory proof.

An old document saying PRODUCTION READY is not enough. An iPad-looking browser mockup is not a physical iPad test. A generated image is not an app screenshot. A self-verified world-record candidate is not Guinness certification.

## Freshness and owner controls

Every current claim should include: inspected date, exact repository/ref, real environment/device, evidence type, outstanding limits and release approvals. Use source-derived inventories, not manually invented route/framework lists. For routes inspect src/config/routeManifest.ts plus src/AppRoutes.tsx (NOT retired src/routes.tsx).

- Active public Cloudflare custom domain: https://vishvakarmaos.app. Never use the old hyphenated .app as a new sign-in or purchase link.
- Supabase account requests must not claim verified sign-up or admin grants without a real server-side receipt.
- Bills, Stripe checkout, SMS, new storage, Guinness submissions and third-party paid quotas require explicit owner approval.
- Do not change human-provided original art, replace working architecture, rewrite shared Git history or delete proof.
- Generated handoff appendices are only current when newly generated and checked on the same source SHA.

## Commands for an approved checkout

    pnpm run lint:types
    pnpm run test
    pnpm run build
    pnpm run docs:verify
    pnpm run handoff:verify
    node scripts/docs/check-source-truth.mjs

Run pnpm run handoff:generate only if code inputs changed and after reviewing the output diff. Release needs additional verified real-device/Playwright, provider, backup and strict gates; see [release commands](./release/VERIFY_COMMANDS.md).

The source-truth script checks authoritative documents and scans legacy Markdown for **potential** drift. Its warnings are not permission to erase historical reports. Document unresolved items in [debt register](./repository/DOCUMENTATION_DEBT_20261119.md).
