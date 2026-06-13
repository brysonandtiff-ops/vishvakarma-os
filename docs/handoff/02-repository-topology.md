# Annex 02 — Repository Topology

[← Handoff index](./HANDOFF.md)

## Workspace layout

| Path | Purpose |
|------|---------|
| `Vishvakarma-os/` (workspace root) | Thin wrapper; Stripe proxy scripts in root `package.json` |
| `Vishvakarma-os/vishvakarma-os-live/` | **Git repository root** — all application code, docs, CI |

**Git remote:** https://github.com/brysonandtiff-ops/vishvakarma-os.git

```bash
cd "vishvakarma-os-live"
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

## Runtime stack

| Layer | Technology |
|-------|------------|
| UI | React 18, React Router 7 |
| Build | Vite (`rolldown-vite`), TypeScript 5.9 |
| Styling | Tailwind CSS, custom workstation tokens |
| 3D | Three.js, React Three Fiber, drei |
| Backend | Supabase Auth, Postgres/RLS, Storage |
| Billing | Stripe (Vercel serverless `api/stripe/*`) |
| AI | Google Gemini (`api/ai/*`) |
| Hosting | Vercel (static `dist/` + API routes) |
| Node | 20.x (`.nvmrc`) |
| Package manager | pnpm 9.15.0 |

**Not Next.js** — client-side SPA with Vercel serverless functions.

## Top-level directories (`vishvakarma-os-live/`)

| Directory | Purpose |
|-----------|---------|
| `src/` | React application (pages, components, backend gateways, core engine) |
| `api/` | Vercel serverless routes (Stripe, Gemini) |
| `server/collab/` | Optional Yjs WebSocket presence server |
| `supabase/` | Postgres migrations, CLI config |
| `scripts/` | Verify, quality gates, migration, Stripe/Supabase setup |
| `e2e/` | Playwright end-to-end specs |
| `tests/anchors/` | Regression anchor tests |
| `docs/` | Specs, release ops, user guides (~79 files) |
| `public/` | Static assets, PWA manifest, sample projects, GLB models |
| `.github/workflows/` | CI (`verify.yml`, `e2e.yml`) |
| `.rules/` | ast-grep structural lint rules |

Full curated tree: [Appendix H](./appendices/H-file-tree.md).

## `src/` top-level modules

| Directory | Purpose |
|-----------|---------|
| `pages/` | Route page components (16 pages) |
| `components/` | UI by domain (editor, workspace, marketing, ui, auth, billing) |
| `backend/supabase/` | Production Supabase gateways |
| `db/` | High-level data API facade (`api.ts`) |
| `core/` | Floor plan engine, manifest schema, exporters |
| `core-contract/` | System contract schemas, build-gate manifest |
| `governance/` | Client-side enforcer, gates, snapshots |
| `services/` | Cost, council, copilot, floorplan generation, optimization |
| `modules/` | Export/import, compliance, collaboration, AI designer |
| `ai/` | Building-designer pipeline |
| `editor/` | Editor-local drafts and tool state |
| `collaboration/` | Yjs CRDT sync layer |
| `hooks/`, `contexts/`, `config/`, `types/`, `lib/`, `utils/` | Shared infrastructure |

## npm scripts taxonomy

**68 scripts** — full list in [Appendix C](./appendices/C-npm-scripts.md).

| Category | Examples |
|----------|----------|
| Dev/build | `dev`, `build`, `preview`, `preview:e2e` |
| Unit tests | `test`, `test:coverage`, `test:routes`, `test:anchors` |
| E2E | `test:e2e`, `test:e2e:auth`, `test:e2e:cross-browser`, `test:e2e:a11y` |
| Lint | `lint`, `lint:types`, `lint:deps`, `lint:structure` |
| Quality gates | `contract:gates`, `auth:gates`, `hardening:gates`, `flawless:gates`, `launch:evidence`, `release:gates` |
| Verify/CI | `verify`, `verify:ci`, `ci`, `handoff:generate`, `handoff:verify` |
| Supabase | `setup:supabase-auth`, `verify:supabase-schema`, `test:supabase-auth` |
| Stripe | `setup:stripe`, `verify:stripe-billing` |
| Deploy | `deploy:vercel`, `collab:server` |

## Documentation index

[`docs/README.md`](../README.md) — canonical doc categories and verification commands.

Historical step docs (`STEP*_*.md`, `TODO.md` at repo root) are **point-in-time snapshots**; superseded by this handoff pack and [`CURRENT_PRODUCTION_ARCHITECTURE.md`](../CURRENT_PRODUCTION_ARCHITECTURE.md).
