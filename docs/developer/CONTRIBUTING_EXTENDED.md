# Contributing (Extended)

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

Extended contributor guide. Quick start: [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Branch strategy

- **`main`** — production-ready; protected by CI
- Feature branches: `feat/short-description`
- Fixes: `fix/short-description`
- Docs: `docs/short-description`

Rebase or merge from `main` before opening PR. Keep PRs focused and reviewable.

---

## Pull request checklist

- [ ] `pnpm run lint:types` passes
- [ ] `pnpm run verify:ci` passes (or explain skipped checks)
- [ ] Tests added/updated for behavior changes
- [ ] [CHANGELOG.md](../../CHANGELOG.md) updated for user-visible changes
- [ ] `pnpm run handoff:generate` if routes, API, env refs, schema, or scripts changed
- [ ] `pnpm run docs:verify` if documentation changed
- [ ] No secrets, `.env` files, or filled operator annexes committed
- [ ] PR template governance checklist completed

---

## Code conventions

- TypeScript strict null checks via `tsconfig.check.json`
- Biome + ast-grep for lint structure
- Editor changes: `ToolRail` → `EditorPage` → `FloorPlanEngine` → `ProjectManifest` → canvas/viewport
- Use `src/db/api.ts` for persistence — not raw Supabase clients
- Semantic CSS tokens only in UI (see [BRAND_LOCK.md](../BRAND_LOCK.md))

---

## Manifest and schema changes

When adding manifest fields:

1. Update `src/types/types.ts`
2. Update `src/core/manifestSchema.ts`
3. Update export/import modules
4. Add/update Vitest evidence tests
5. Update [project-manifest-schema.md](../project-manifest-schema.md)

---

## Governance and specs

- Spec changes require change-request workflow per [SPEC.md](../SPEC.md) (historical) and live governance routes
- Release gates: `src/governance/gates/gate-manifest.json`
- Ship evidence under `docs/release/evidence/` when gates require it

---

## Architecture decisions

New significant decisions: add an ADR in [docs/adr/](../adr/README.md) using the MADR template.

Pre-implementation proposals: [docs/rfc/](../rfc/README.md)

---

## Deployment references

- [release/VERCEL_ENV.md](../release/VERCEL_ENV.md)
- [supabase/README.md](../../supabase/README.md)
- [MIGRATION.md](../../MIGRATION.md)

---

## Code of conduct

See [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md).
