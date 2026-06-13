# Annex 01 — Product and Business

[← Handoff index](./HANDOFF.md)

## Product definition

Vishvakarma.OS is an **iPad-first, browser-native architectural workstation** combining 2D blueprint editing, live 3D visualization, AI-assisted design, optimization, compliance/council/cost decision support, Stripe monetization, and an embedded **Governance Operating System**.

| Source | Path |
|--------|------|
| PRD | [`docs/prd.md`](../prd.md) |
| Audited capabilities | [`docs/PRODUCT_CAPABILITIES.md`](../PRODUCT_CAPABILITIES.md) |
| Technical inventory | [`docs/SOFTWARE_INVENTORY.md`](../SOFTWARE_INVENTORY.md) |
| Version | `1.2.0` — [`src/config/appVersion.ts`](../../src/config/appVersion.ts), [`package.json`](../../package.json) |

**Production URL:** https://vishvakarma-os.vercel.app

## Target users

Architects, interior designers, builders, students, and project managers who need governed blueprints with export and collaboration workflows (see [`docs/prd.md`](../prd.md)).

## Pricing tiers

Source: [`src/config/billingPlans.ts`](../../src/config/billingPlans.ts)

| Tier | Price | Trial | Self-serve checkout | Highlights |
|------|------:|-------|---------------------|------------|
| **Starter** | Free | — | No | 1 project, 2D tools, PNG export, local draft |
| **Studio** | $499/mo | 14 days | Yes | Unlimited projects, full 3D, all export formats, cloud save, governance |
| **Enterprise** | $1,000/mo | — | Yes | Studio + SSO/SAML, API, dedicated onboarding (**collaboration planned**) |

Stripe price verification: Studio `49900` cents, Enterprise `100000` cents — [`scripts/verify-stripe-billing.mjs`](../../scripts/verify-stripe-billing.mjs).

## Export entitlements

`resolveExportTier()` in [`src/config/billingPlans.ts`](../../src/config/billingPlans.ts):

- Unconfigured backend (local dev): Studio tier
- Signed out: Starter
- Co-owner emails: Enterprise (see below)
- Active/trialing Studio or Enterprise billing: respective tier
- Default signed-in: Starter

Export formats and marketing labels: [`src/config/marketingFeatures.ts`](../../src/config/marketingFeatures.ts).

## Platform roles

**Profiles (`profiles.role`):**

- `user` — default
- `admin` — governance writes (specs, registry, releases)

Promotion: Supabase Dashboard or [`MIGRATION.md`](../../MIGRATION.md).

## Co-owner model

[`src/config/coOwners.ts`](../../src/config/coOwners.ts) — allowlisted emails receive **enterprise entitlements** and admin governance access without a Stripe subscription. Co-owners must sign in once for Supabase to create their profile row.

## Project member roles

[`src/domain/projects/projectRoles.ts`](../../src/domain/projects/projectRoles.ts)

| Role | Summary |
|------|---------|
| `owner` | Full control including billing and delete |
| `co_owner` | Design, members, governance — no billing/delete |
| `architect` | Edit, AI designer, optimization, exports |
| `builder` | Export, compliance, construction docs |
| `engineer` | Compliance review, construction docs |
| `family` | View + comment |
| `council_reviewer` | View, comment, council/compliance review |
| `viewer` | Read-only |

Locked spec: [`docs/specs/PROJECT_ROLES_AND_PERMISSIONS.md`](../specs/PROJECT_ROLES_AND_PERMISSIONS.md).

## Prototype disclaimers (external claims limits)

[`src/constants/prototypeDisclaimer.ts`](../../src/constants/prototypeDisclaimer.ts)

- **Cost intelligence** — simulated figures, not production-grade pricing
- **Compliance** — NCC stub checks, not certified for council lodgement
- **Copilot** — experimental; some deliverables simulated
- **Optimization** — exploratory rankings, not final certification

Do **not** represent these modules as certified compliance, guaranteed council approval, or binding cost quotes.

## Production vs prototype status

| Surface | Status |
|---------|--------|
| 2D editor, 3D viewport, exports, projects, auth | **Production** |
| Stripe billing, governance OS, marketing | **Production** |
| AI Designer (Gemini) | **Built** — requires `GEMINI_API_KEY` |
| Optimization, compliance, council, cost | **Built** — decision-support disclaimers |
| Collaboration (Yjs/WebSocket) | **Preview scaffold** |
| Enterprise SSO/SAML/API | **Planned** |
| Firebase runtime | **Not in production path** |

See also [Annex 10 — IP, risks, roadmap](./10-ip-risks-roadmap-and-gaps.md).

## Related appendices

- [Appendix A — Routes](./appendices/A-routes-and-api.md)
- [Appendix G — Dependencies](./appendices/G-dependencies.md)
