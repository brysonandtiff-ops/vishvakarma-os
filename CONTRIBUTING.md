# Contributing to Vishvakarma.OS

## Development setup

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

## Verification before PR

```bash
pnpm run verify:ci
pnpm run test:e2e
pnpm run release:gates
```

## Code conventions

- TypeScript strict null checks via `tsconfig.check.json`
- Biome + ast-grep for lint structure
- Editor changes flow: `ToolRail` → `EditorPage` → `FloorPlanEngine` → `ProjectManifest` → `BlueprintCanvas` + `Viewport3D`
- New manifest fields require updates to `src/types/types.ts`, `src/core/manifestSchema.ts`, export/import, and evidence tests

## Governance

- Spec changes require change-request workflow per `docs/SPEC.md`
- Release gates defined in `src/governance/gates/gate-manifest.json`
- Update `CHANGELOG.md` and evidence files when shipping user-visible changes

## Deployment

See `docs/release/VERCEL_ENV.md`, `supabase/README.md`, and `MIGRATION.md`.
