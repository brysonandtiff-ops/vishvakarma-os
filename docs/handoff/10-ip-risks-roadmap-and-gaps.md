# Annex 10 — IP, Risks, Roadmap, and Gaps

[← Handoff index](./HANDOFF.md)

## Brand and IP

| Asset | Location |
|-------|----------|
| Brand lock rules | [`docs/BRAND_LOCK.md`](../BRAND_LOCK.md) |
| Founders metadata | [`src/brand/founders.ts`](../../src/brand/founders.ts) |
| Marketing design assets | [`docs/design/`](../design/) |
| Locked governing specs | [`docs/specs/`](../specs/), [`docs/SPEC.md`](../SPEC.md) |
| Registry | [`docs/REGISTRY.md`](../REGISTRY.md) |

Product name: **Vishvakarma.OS** — gold workstation brand (see BRAND_LOCK).

## Open-source dependencies

Full inventory with versions: [Appendix G](./appendices/G-dependencies.md)

Due diligence: run `pnpm licenses list` for license audit. No `license` field in root `package.json` — product is `private: true`.

Vendored agent skills: [`.agents/skills/`](../../.agents/skills/) (Supabase skills, MIT).

## Production vs preview matrix

| Surface | Status | Evidence |
|---------|--------|----------|
| 2D editor, 3D viewport, exports, projects, auth | Production | CI/E2E, launch evidence |
| Stripe billing, governance OS, marketing | Production | verify scripts, operator checklist |
| AI Designer (Gemini) | Built — requires `GEMINI_API_KEY` | `api/ai/*` |
| Optimization, compliance, council, cost | Built — decision-support | prototype disclaimers |
| Collaboration (Yjs/WS) | Preview scaffold | README, PRODUCT_CAPABILITIES |
| Enterprise SSO/SAML/API | Planned | `billingPlans.ts` enterprise features |
| Sentry monitoring | Scaffold only | `monitoring.ts`, no SDK dep |
| Firebase runtime | **Not in production** | auth gates forbid firebase backend |
| Multi-floor scaffold | Shipped v1.2.0 | CHANGELOG |

## RFC backlog (proposed, not implemented)

[`docs/rfc/README.md`](../rfc/README.md)

| RFC | Status | Summary |
|-----|--------|---------|
| [001-curved-walls.md](../rfc/001-curved-walls.md) | Proposed | Bézier wall segments |
| [002-dxf-import.md](../rfc/002-dxf-import.md) | Proposed | DXF/DWG import pipeline |
| [005-building-codes.md](../rfc/005-building-codes.md) | Proposed | Rule-based compliance checks |

## Known gaps and incomplete items

| Item | Status | Reference |
|------|--------|-----------|
| Real-time collaboration | Preview scaffold | [`src/collaboration/`](../../src/collaboration/), README |
| Enterprise SSO / API | Listed as planned | [`src/config/billingPlans.ts`](../../src/config/billingPlans.ts) |
| Operator Google sign-in evidence | May be incomplete | [`docs/release/evidence/auth-sign-in-proof.md`](../release/evidence/auth-sign-in-proof.md) |
| Pricing page | Flag-gated | `VITE_PRICING_PAGE_ENABLED` |
| Compliance engine | NCC/zoning stubs | PRODUCT_CAPABILITIES §8 |

## Stale documentation registry

These files were **reconciled during handoff** or marked as historical:

| File | Status |
|------|--------|
| [`SECURITY.md`](../../SECURITY.md) | Updated — Supabase production path |
| [`docs/release/DEPLOYMENT.md`](../release/DEPLOYMENT.md) | Updated — Supabase-first deploy |
| [`.env.stripe.local.example`](../../.env.stripe.local.example) | Updated — removed Firebase backend refs |
| [`docs/rfc/README.md`](../rfc/README.md) | Updated — removed missing RFC 003/004 |
| [`tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md`](../../tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md) | **Historical** — editor was at `/`, now `/editor` |
| CI E2E jobs | Placeholder `VITE_FIREBASE_*` for legacy compatibility — not production path |
| Root step docs (`STEP*_*.md`, `TODO.md`) | **Historical snapshots** — use handoff pack |

**Truth hierarchy:**

1. This handoff pack + [`CURRENT_PRODUCTION_ARCHITECTURE.md`](../CURRENT_PRODUCTION_ARCHITECTURE.md)
2. [`SOFTWARE_INVENTORY.md`](../SOFTWARE_INVENTORY.md), [`PRODUCT_CAPABILITIES.md`](../PRODUCT_CAPABILITIES.md)
3. [`README.md`](../../README.md), [`docs/README.md`](../README.md)
4. Historical step/build docs (lowest precedence)

## v2 notes

[`docs/v2/ARCHITECTURE.md`](../v2/ARCHITECTURE.md) — forward-looking architecture (not current production claims).

## Version history

[`CHANGELOG.md`](../../CHANGELOG.md) — through v1.2.0 (2026-06-09).

## Risk summary for valuation reviewers

1. **Prototype intelligence modules** — cost/compliance/council outputs require disclaimer in GTM materials
2. **Collaboration** — marketed as planned on Enterprise tier; implementation is preview only
3. **Firebase legacy** — scripts and CI placeholders remain; runtime is Supabase-only
4. **Single-operator dependencies** — co-owner allowlist in code; Stripe/Supabase tied to specific accounts until transfer
5. **AI dependency** — Gemini API key required for full copilot server path; local parsers exist as fallback
