# Developer Onboarding

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

Day-1 guide to run Vishvakarma.OS locally and ship your first change.

**Cursor / coding agents:** start with [AGENTS.md](../../AGENTS.md) for verify, ship, and precedence rules.

---

## Prerequisites

- **Node.js** 20.x (see `.nvmrc`)
- **pnpm** 9.15.0
- Git access to the repository

---

## Setup (10 minutes)

```bash
cd vishvakarma-os-live
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

Open http://127.0.0.1:5173

### Environment variables

Minimum for local demo (no cloud save):

```env
VITE_ALLOW_LOCAL_DEMO=true
```

For full Supabase auth and persistence, configure variables from [handoff/appendices/B-environment-variables.md](../handoff/appendices/B-environment-variables.md):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_REDIRECT_ORIGIN=http://127.0.0.1:5173
```

See [release/SUPABASE_AUTH_SETUP.md](../release/SUPABASE_AUTH_SETUP.md) for provider setup.

---

## Verify your environment

```bash
pnpm run lint:types
pnpm run test
pnpm run verify:ci
```

Full command matrix: [release/VERIFY_COMMANDS.md](../release/VERIFY_COMMANDS.md)

---

## Codebase orientation

| Path | Purpose |
|------|---------|
| `src/pages/` | Route pages (editor, governance, billing) |
| `src/components/editor/` | 2D canvas, 3D viewport, tool rail |
| `src/db/api.ts` | **Persistence facade** — always use this, not raw Supabase |
| `src/backend/supabase/` | Supabase gateway implementations |
| `api/` | Vercel serverless (Stripe, Gemini AI) |
| `src/governance/` | Release gates, audit, world records |
| `supabase/migrations/` | Postgres schema |

Architecture overview: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Editor change pipeline

When modifying editor behavior, trace this flow:

```
ToolRail → EditorPage → FloorPlanEngine → ProjectManifest → BlueprintCanvas + Viewport3D
```

Manifest schema changes require updates to:

1. `src/types/types.ts`
2. `src/core/manifestSchema.ts`
3. Export/import modules
4. Evidence tests under `src/test/`

---

## First PR checklist

1. Branch from `main`: `feat/short-description` or `fix/short-description`
2. Run `pnpm run verify:ci` before opening PR
3. Update [CHANGELOG.md](../../CHANGELOG.md) for user-visible changes
4. If routes, API, env, or schema changed: `pnpm run handoff:generate`
5. Run `pnpm run docs:verify` when touching documentation

Extended guide: [CONTRIBUTING_EXTENDED.md](./CONTRIBUTING_EXTENDED.md)

---

## Governance

Spec and release changes flow through the Governance OS:

- [GOVERNANCE_QUICKSTART.md](../GOVERNANCE_QUICKSTART.md)
- Release gates: `src/governance/gates/gate-manifest.json`

---

## Next steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- [API.md](./API.md) — persistence and serverless routes
- [TESTING.md](./TESTING.md) — test pyramid
- [CI_CD.md](./CI_CD.md) — GitHub Actions and verify scripts
