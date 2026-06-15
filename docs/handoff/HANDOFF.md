# Vishvakarma.OS — Valuation Handoff Pack

**Document type:** Technical due diligence and operator transition handoff  
**Product version:** v1.5.0  
**Audit date:** 2026-06-15  
**Canonical production URL:** https://vishvakarma-os.app  
**Vercel fallback URL:** https://vishvakarma-os.vercel.app  
**Git remote:** https://github.com/brysonandtiff-ops/vishvakarma-os.git  

**Repository location:** All application code lives in `vishvakarma-os-live/` (git root). The parent workspace folder is a thin wrapper only.

---

## Purpose and audience

This pack is the **single entry point** for valuation, acquisition due diligence, investor technical review, and operator handover. It orchestrates existing documentation and adds **auto-generated appendices** so inventories stay aligned with live code.

| Audience | Recommended reading order |
|----------|---------------------------|
| **ChatGPT / AI assistant** | [CHATGPT_HANDOFF.md](./CHATGPT_HANDOFF.md) — single paste-ready doc (start here for AI context) |
| **Executive / investor** | This page (Executive summary) → [Annex 01](./01-product-and-business.md) → [Annex 10](./10-ip-risks-roadmap-and-gaps.md) |
| **Technical acquirer** | Annexes 02–06 → Appendices A–H → [SOFTWARE_INVENTORY.md](../SOFTWARE_INVENTORY.md) |
| **Operator / DevOps** | [Annex 07](./07-integrations-and-accounts.md) → [Annex 08](./08-operations-and-deployment.md) → [Operator Annex template](./templates/OPERATOR_ANNEX.template.md) → [OPERATOR_CHECKLIST.md](../release/OPERATOR_CHECKLIST.md) |
| **QA / release** | [Annex 09](./09-testing-quality-and-release.md) → [VERIFY_COMMANDS.md](../release/VERIFY_COMMANDS.md) |

---

## Executive summary

Vishvakarma.OS is an **iPad-first, browser-native architectural workstation** delivered as a Vite + React 18 single-page application. It integrates:

1. **CAD-lite 2D drafting** with walls, openings, MEP, furniture, landscape, terrain, and Vastu tools
2. **BIM-lite live 2D→3D sync** (Three.js/R3F) with solar lighting and GLB models
3. **AI architecture copilot** (Gemini + local parsers) with permit package export
4. **Multi-objective design optimization** with cost and council scoring
5. **Rule-based compliance pre-check** (decision-support, not certified)
6. **Governance OS** — specs, registry, change requests, 13-gate releases, audit, world records
7. **Stripe monetization** — Starter (free), Studio ($499/mo), Enterprise ($1,000/mo)

**Current production backend:** Supabase-only (Auth, Postgres/RLS, Storage, billing entitlements). Stripe handles payments. Vercel hosts the SPA and serverless API routes. Firebase artifacts remain as **legacy migration tooling only** — not the runtime path.

**Framework note:** This is **not Next.js**. Routing is client-side (React Router 7). API routes are Vercel serverless functions in `api/`.

---

## Critical facts (quick reference)

| Fact | Value |
|------|-------|
| Product version | 1.5.0 |
| Canonical production URL | https://vishvakarma-os.app |
| Vercel fallback URL | https://vishvakarma-os.vercel.app |
| Supabase project ref | `jyocvwipthswfcmvqgqe` |
| Runtime backend | Supabase Auth + Postgres + Storage |
| Billing | Stripe Checkout + Portal + webhooks |
| AI | Gemini via `api/ai/*` (requires `GEMINI_API_KEY`) |
| Node | 20.x |
| Package manager | pnpm 9.15.0 |

---

## Truth hierarchy

When documents conflict, use this precedence:

1. **This handoff pack** + [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md)
2. [SOFTWARE_INVENTORY.md](../SOFTWARE_INVENTORY.md), [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md)
3. Auto-generated [appendices](./appendices/) (from live code via `pnpm run handoff:generate`)
4. [README.md](../../README.md), [docs/README.md](../README.md)
5. Historical step/build docs (`STEP*_*.md`, `tasks/VISHVAKARMA_OS_BUILD_DOCUMENT.md`) — **lowest precedence**

---

## Annex documents

| # | Document | Scope |
|---|----------|-------|
| 01 | [Product and business](./01-product-and-business.md) | Pricing, roles, disclaimers, production status |
| 02 | [Repository topology](./02-repository-topology.md) | Folder layout, stack, scripts taxonomy |
| 03 | [Architecture and data flow](./03-architecture-and-data-flow.md) | SPA, gateways, API, module graph |
| 04 | [Application surface](./04-application-surface.md) | Routes, features, exports |
| 05 | [Data model and migrations](./05-data-model-and-migrations.md) | Postgres schema, portability |
| 06 | [Security and compliance](./06-security-and-compliance.md) | RLS, headers, claims limits |
| 07 | [Integrations and accounts](./07-integrations-and-accounts.md) | Third-party registry, transfer checklist |
| 08 | [Operations and deployment](./08-operations-and-deployment.md) | Local dev, Vercel, Supabase, Stripe ops |
| 09 | [Testing, quality, release](./09-testing-quality-and-release.md) | Vitest, Playwright, CI, 13 gates |
| 10 | [IP, risks, roadmap, gaps](./10-ip-risks-roadmap-and-gaps.md) | Brand, RFCs, stale docs, risks |

---

## Auto-generated appendices

Regenerate after code changes: `pnpm run handoff:generate`  
Verify completeness: `pnpm run handoff:verify`

| Appendix | Contents |
|----------|----------|
| [A — Routes and API](./appendices/A-routes-and-api.md) | All client routes + serverless handlers |
| [B — Environment variables](./appendices/B-environment-variables.md) | Every `VITE_*` and `process.env` reference |
| [C — npm scripts](./appendices/C-npm-scripts.md) | All package.json scripts |
| [D — Database schema](./appendices/D-database-schema.md) | Migrations, tables, policies |
| [E — Verify scripts](./appendices/E-verify-scripts.md) | Quality gates and verify commands |
| [F — Test inventory](./appendices/F-test-inventory.md) | Vitest + Playwright file list |
| [G — Dependencies](./appendices/G-dependencies.md) | Prod and dev dependency versions |
| [H — File tree](./appendices/H-file-tree.md) | Curated production directory tree |
| [MANIFEST.json](./appendices/MANIFEST.json) | Machine-readable index + git SHA |

---

## Operator annex (secrets off-repo)

**Do not commit filled credentials to git.**

1. Copy [`templates/OPERATOR_ANNEX.template.md`](./templates/OPERATOR_ANNEX.template.md) to `docs/handoff/OPERATOR_ANNEX.md` (gitignored)
2. Complete all account ownership fields
3. Deliver via secure channel (password manager, encrypted data room, signed transfer)

---

## Related canonical documents

| Document | Purpose |
|----------|---------|
| [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md) | Supabase-only production addendum |
| [SOFTWARE_INVENTORY.md](../SOFTWARE_INVENTORY.md) | Deep technical inventory |
| [MIGRATION.md](../../MIGRATION.md) | Data portability and backend migration |
| [OPERATOR_CHECKLIST.md](../release/OPERATOR_CHECKLIST.md) | Launch gates 9–12 |
| [VERCEL_ENV.md](../release/VERCEL_ENV.md) | Complete env var matrix |
| [docs/specs/](../specs/) | Locked governing specifications |
| [CHANGELOG.md](../../CHANGELOG.md) | Version history |

---

## Completeness attestation

| Check | Result | Notes |
|-------|--------|-------|
| `pnpm run handoff:generate` | **PASS** | 16 routes, 6 API handlers, 103 scripts, 10 tables |
| `pnpm run handoff:verify` | **PASS** | All annexes and appendices present |
| `pnpm run docs:verify` | **PASS** | Documentation program link and version checks |
| `pnpm run lint:types` | **PASS** | tsgo app + api configs |
| ChatGPT handoff doc | **PASS** | [CHATGPT_HANDOFF.md](./CHATGPT_HANDOFF.md) at v1.5.0 |
| Git SHA | See [MANIFEST.json](./appendices/MANIFEST.json) | `b15a92d5f5cc5846937674957de39fd9cc45684e` |

**Domain cutover:** Supabase `site_url` and repo defaults now use `https://vishvakarma-os.app`. Confirm Vercel Production env matches, then attach green CI run URL.

**Sign-off command block:**

```bash
cd vishvakarma-os-live
pnpm run handoff:generate
pnpm run handoff:verify
pnpm run docs:verify
pnpm run lint:types
pnpm run verify:ci
```

---

## Quick start for new operators

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
pnpm run verify:ci
```

Full reading order: Annexes 01 → 10, then appendices A → H.
