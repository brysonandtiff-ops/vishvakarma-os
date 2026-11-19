# Vishvakarma.OS
### Imagine a home. Draw its blueprint. Explore the space.

**Vishvakarma.OS is an original iPad-first architectural design studio** combining 2D floor plans, a Three.js 3D scene, guided exploration, project storage, export tools and an evidence-minded Governance OS. Its human-centred vision is simple: **Projects → Draw → 3D → Walk → Save & Share.**

The design preserves the owner's genuine swan/V emblem, black-and-gold identity and cream drafting paper. See the [visual master](docs/BRAND_LOCK.md) and [owner's original gift concept](docs/design/ORIGINAL_GIFT_DESIGN_MASTER_2026-11-19.md). The private dedication and original image have not been published into the app's public assets.

## Real status · 19 November 2026

**Local Studio candidate frozen. Production release is blocked.** Cloudflare Pages identifies the active [public website](https://vishvakarmaos.app/) as the August build. The unified Studio candidate is recorded by the local Git tag `vishvakarma-studio-freeze-20261119`.

| Proof | Actual finding |
| --- | --- |
| Studio workflow | Draw a Blueprint, inspect it in 3D and Walk, then save, reopen, or export from Studio. Desktop Chromium verified the browser-local round trip. |
| Touch controls | Phone Chromium emulation verified drawing, Walk movement and Details. Physical device acceptance remains open. |
| Cloudflare | Production and preview SHA values are recorded in the [release decision](docs/release/CURRENT_RELEASE_STATUS.md). The Studio candidate still needs its own hosted proof. |
| Signed-in workflow | Approved account, tenant permissions and cloud save/reopen require fresh evidence. |
| Production and safety | Release **BLOCKED** by [security #153](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/153), [encrypted backup #188](https://github.com/brysonandtiff-ops/vishvakarma-os/issues/188), provider/account and real-device proof. |

### What the source contains

- **2D drafting:** walls, openings, rooms, measurements, snap/grid, undo/redo.
- **Interactive 3D:** React Three Fiber/Three.js builds the scene from the project manifest. Studio provides 3D orbit and eye-height Walk with desktop and touch controls.
- **Projects and export:** local draft paths, Supabase gateways, and JSON/PNG/PDF/DXF/SVG export code; real cloud restore and file round-trip not yet certified.
- **Professional workflows:** optimization, registry, specifications, change requests, releases, audit and an internal **self-verified world-record candidate**. There is no Guinness certification.
- **Learning and onboarding:** public eight-chapter voice tour with Read Without Sound and a staged private cinematic welcome. The actual spoken experience depends on device voices.
- **Account and payments:** approved-account Google/email-link UI, Supabase and Stripe-related source. Code and visible pricing do not prove live signup, admin permissions, subscriptions or transactions.

See the [capability reality matrix](docs/repository/SOURCE_OF_TRUTH_20261119.md) for evidence boundaries.

## Explore safely

Public [Features](https://vishvakarmaos.app/features) and [Pricing](https://vishvakarmaos.app/pricing) pages are available. Private project pages require a genuinely approved account. An invitation request does **not** automatically create a new account.

The [release decision](docs/release/CURRENT_RELEASE_STATUS.md) identifies the current hosted source. Stripe checkout and billing acceptance are still open.

## Develop at the actual Git repository root

The checkout root contains package.json, src/, docs/, scripts/ and supabase/. Do not recreate the obsolete nested workspace.

    pnpm install --frozen-lockfile
    cp .env.example .env.local
    pnpm run dev

Basic development checks:

    pnpm run lint:types
    pnpm run test
    pnpm run build
    pnpm run docs:verify
    pnpm run handoff:verify

For a release, additionally prove the exact production SHA, real accounts/RLS, true save/reopen/export, device accessibility, encrypted recoverable backups, security and explicit owner approval. Green preview builds alone do not grant release approval.

## Documentation, in the right order

| Start here | Purpose |
| --- | --- |
| [Current release decision](docs/release/CURRENT_RELEASE_STATUS.md) | What actually blocks launch |
| [Source-of-truth matrix](docs/repository/SOURCE_OF_TRUTH_20261119.md) | Implemented vs verified vs blocked |
| [November evidence ledger](docs/release/evidence/REVIEW_VERIFICATION_LEDGER_20261119.md) | Source SHAs, browser runs and test counts |
| [Documentation hub](docs/README.md) | Guides for users, developers and operators |
| [Getting started](docs/user/GETTING_STARTED.md) | Safe private-trial and iPad instructions |
| [Current Cloudflare architecture](docs/CURRENT_PRODUCTION_ARCHITECTURE.md) | Hosting and provider boundaries |
| [Historical software inventory](docs/SOFTWARE_INVENTORY.md) | Older detailed source map, not current runtime proof |
| [Documentation debt](docs/repository/DOCUMENTATION_DEBT_20261119.md) | Legacy claims still needing review |

**Protect original work:** no fabricated runtime screenshots, silent removal of art/history, surprise billing, force pushes or unverified completion claims.
