# Contributing to Vishvakarma.OS

Thank you for contributing. This guide covers setup, expectations, and verification.

**Extended guide:** [docs/developer/CONTRIBUTING_EXTENDED.md](docs/developer/CONTRIBUTING_EXTENDED.md)  
**Code of conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## Development setup

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

Full onboarding: [docs/developer/ONBOARDING.md](docs/developer/ONBOARDING.md)

---

## Before opening a PR

```bash
pnpm run lint:types
pnpm run verify:ci
pnpm run test:e2e          # when UI or auth changed
pnpm run release:gates     # before release-bound changes
pnpm run handoff:generate  # when routes, API, schema, or scripts changed
pnpm run docs:verify       # when documentation changed
```

---

## Pull request expectations

1. **Focused scope** — one feature or fix per PR
2. **Tests** — add or update tests for behavior changes
3. **CHANGELOG** — update [CHANGELOG.md](CHANGELOG.md) for user-visible changes
4. **Documentation** — update relevant docs in `docs/` when behavior or setup changes
5. **No secrets** — never commit `.env`, credentials, or filled operator annexes
6. **PR template** — complete the governance checklist in `.github/PULL_REQUEST_TEMPLATE.md`

---

## Code conventions

- TypeScript strict null checks via `tsconfig.check.json`
- Biome + ast-grep for lint structure
- Editor changes flow: `ToolRail` → `EditorPage` → `FloorPlanEngine` → `ProjectManifest` → `BlueprintCanvas` + `Viewport3D`
- Persistence via `src/db/api.ts` only — not raw Supabase clients
- New manifest fields require updates to `src/types/types.ts`, `src/core/manifestSchema.ts`, export/import, and evidence tests

---

## Governance

- Spec changes require change-request workflow per governance routes
- Release gates defined in `src/governance/gates/gate-manifest.json`
- Architecture decisions: [docs/adr/README.md](docs/adr/README.md)

---

## Documentation

- Hub: [docs/README.md](docs/README.md)
- Standards: [docs/DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)

---

## Deployment

See [docs/release/VERCEL_ENV.md](docs/release/VERCEL_ENV.md), [supabase/README.md](supabase/README.md), and [MIGRATION.md](MIGRATION.md).
