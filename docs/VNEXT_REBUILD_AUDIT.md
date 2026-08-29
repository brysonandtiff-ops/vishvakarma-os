# Vishvakarma.OS vNext — Cloudflare-Native Rebuild Audit

## Decision

Do **not** throw away the product. Rebuild the runtime foundation while preserving the proven editor, data model, UX, exports, tests, and Supabase persistence contracts.

## Current evidence

- Current default branch: `main`
- Audit base SHA: `12e8ce5419be909d2bc402efe8d30fc87786d639`
- Current release direction is Cloudflare-oriented.
- `wrangler.jsonc` exists and targets `./dist`.
- The repo still contains Vercel-specific production environment/examples and deployment scripts.
- `package.json` still contains Vercel analytics and multiple Vercel-specific operational scripts.
- `docs/developer/ARCHITECTURE.md` still describes Vercel serverless functions as the production API runtime.
- Supabase remains the intended persistence/auth backend.

## Preserve

1. React/Vite application shell where code quality is proven.
2. Project Manifest as the canonical editor state contract.
3. Floor-plan engine and 2D/3D synchronization.
4. `src/db/api.ts` persistence facade and Supabase gateway separation.
5. Supabase schema, RLS policies, auth contracts, storage contracts.
6. Export/import modules: PDF, SVG, DXF, JSON.
7. Compliance and optimization domain logic.
8. Existing accessibility, route, editor, screenshot, performance and regression tests that still represent product requirements.
9. iPad-first interaction patterns and responsive UI behavior.
10. Product copy, design tokens and validated user flows.

## Rebuild / replace

1. Replace all Vercel production API assumptions with Cloudflare Workers/Pages Functions equivalents.
2. Remove Vercel production fallbacks, Vercel analytics runtime dependency, Vercel env push scripts and Vercel deployment scripts from the active runtime path.
3. Create one canonical production-origin resolver for auth, billing callbacks, AI API routes and redirects.
4. Collapse deployment configuration to Cloudflare + Supabase only.
5. Separate generated evidence/local proof artifacts from source-controlled runtime code.
6. Reduce the operational script surface into a small deterministic verification ladder.
7. Re-document architecture so documentation matches deployed reality.
8. Rebuild billing and AI server endpoints against Cloudflare request/response primitives.
9. Add explicit guards that fail CI if production code references `vercel.app`, Vercel runtime APIs, or obsolete production origins.
10. Add Cloudflare deployment smoke tests and Supabase redirect/auth proof.

## Do not migrate blindly

- Historical evidence archives
- Local proof dumps
- Dead migration scaffolds
- Old deployment wrappers
- Duplicate repair scripts
- Obsolete Firebase runtime artifacts
- Any environment file containing real secrets

## Target architecture

```text
Browser / iPad PWA
      |
      v
Vite + React + TypeScript
      |
      +--> Supabase Auth
      +--> Supabase Postgres / RLS
      +--> Supabase Storage
      |
      +--> Cloudflare API runtime
             +--> Stripe
             +--> Gemini / AI providers
             +--> privileged server operations
```

## Migration sequence

### Phase 1 — Contract freeze

Freeze and test the current product contracts before moving runtime code:

- route inventory
- auth behavior
- Project Manifest schema
- editor save/reload
- 2D/3D synchronization
- export outputs
- billing behavior
- AI request/response contracts

### Phase 2 — Cloudflare runtime extraction

Create Cloudflare-native server handlers for AI and Stripe. Keep endpoint contracts identical so the frontend does not need a simultaneous rewrite.

### Phase 3 — Production-origin hardening

Create a single production-origin configuration. Add CI guards that reject Vercel production URLs or Vercel runtime imports.

### Phase 4 — Operational simplification

Replace the large collection of overlapping release/repair scripts with a canonical ladder:

1. typecheck
2. lint
3. unit tests
4. contract tests
5. auth/security tests
6. build
7. Playwright smoke/a11y
8. Cloudflare configuration check
9. deployment
10. post-deploy smoke

### Phase 5 — Feature-parity proof

Run the old and vNext builds side-by-side. vNext must prove parity for editor, projects, auth, persistence, exports, billing and AI before cutover.

### Phase 6 — Production cutover

Only after parity passes:

- deploy vNext to Cloudflare production
- set Supabase production Site URL/redirects to the Cloudflare canonical origin
- verify login, signup, password reset and OAuth callback behavior
- verify Stripe webhook/callback behavior
- verify AI endpoints
- capture release evidence
- archive old runtime path

## Definition of done

vNext is complete when:

- Cloudflare is the only production hosting/API runtime.
- Supabase is the only auth/database/storage backend.
- No active production code depends on Vercel.
- All core Vishvakarma.OS features pass parity tests.
- iPad workflows pass accessibility and interaction verification.
- Production auth redirects resolve only to the canonical Cloudflare origin.
- CI rejects future deployment drift.
- Architecture documentation matches deployed production truth.

## Current status

**SAFE TO PROCEED WITH REBUILD FOUNDATION.**

The evidence indicates that the product itself should be preserved. The primary rebuild target is deployment/runtime architecture and operational complexity, not the core editor or product model.
