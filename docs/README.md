# Vishvakarma.OS Documentation

## Valuation handoff (start here for due diligence)

**[docs/handoff/HANDOFF.md](./handoff/HANDOFF.md)** — master index for valuation, acquisition review, and operator transition. Includes auto-generated appendices (`pnpm run handoff:generate`).

## Overview

Vishvakarma.OS is an iPad-first, browser-native architectural blueprint and live 3D studio with a strict governance framework. The system provides a unified workspace for 2D blueprint editing with real-time 3D visualization, material application, and solar lighting simulation.

**Current production architecture:** [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md)

**Product capabilities (audited):** [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md)

**Software inventory (valuation / due diligence):** [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md)

> **Current-state note:** Production is Supabase-first/Supabase-only for auth, Postgres, storage, and billing entitlements. If older docs mention Firebase as the live backend or a runtime-selectable dual backend, treat [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) as superseding.

---

## Application routes

Source of truth: `src/routes.tsx`

### Public routes

| Route | Page | Notes |
|-------|------|-------|
| `/` | Landing | Marketing home |
| `/features` | Features & Guides | Product reference |
| `/pricing` | Pricing | Only when `VITE_PRICING_PAGE_ENABLED=true` |
| `/auth` | Account Access | Supabase email link + Google OAuth |
| `/reset-password` | Reset Password | Password reset support |
| `/404` | Not Found | Unknown route fallback |

### Private routes (auth required)

| Route | Page | Description |
|-------|------|-------------|
| `/editor` | Blueprint Editor | Main 2D + 3D workspace |
| `/projects` | Projects | Cloud/local project library |
| `/optimization` | Design Optimization | Candidate scoring and promotion |
| `/profile` | Profile | Account + billing |
| `/spec-center` | Spec Center | Locked governing specifications |
| `/registry` | Registry Center | Component and feature inventory |
| `/change-requests` | Change Requests | Governed change workflow |
| `/releases` | Release Center | Gate-checked release pipeline |
| `/world-records` | World Records | Self-verified gate-count registry |
| `/audit` | Audit Log | Full system event timeline |

---

## Repository layout

```text
vishvakarma-os-live/
  src/
    components/editor/     2D/3D editor UI
    pages/                 route pages (landing, editor, governance, billing)
    backend/supabase/      production backend gateways
    db/api.ts              persistence facade
    modules/               export, import, compliance, optimization, governance
    services/              cost, council, copilot, optimization, planning
    governance/            release gates, records, snapshots
    test/                  Vitest unit/integration tests
  api/
    stripe/                checkout, portal, webhook routes
    ai/                    Gemini-backed parsing routes
    _lib/                  shared Stripe, Supabase, billing helpers
  server/collab/           Yjs WebSocket presence server (preview)
  scripts/
    quality/               contract, auth, hardening, launch evidence gates
    migration/             export/import/validate Supabase JSON
    production/            env verify, evidence, legacy Firebase admin helpers
    world-record/          gate-count measurement artifacts
  supabase/migrations/     Postgres schema (5 migrations)
  docs/                    specifications, release evidence, user guides
  e2e/                     Playwright specs
  public/samples/          sample project manifests
  tasks/                   historical build-plan artifacts (see tasks/README.md)
```

---

## Architecture

### Single source of truth principle

1. **Project Manifest** — complete editor state (walls, openings, materials, lighting)
2. **Route Manifest** — navigation paths (`src/routes.tsx`, validated in tests)
3. **`/docs` directory** — specifications and documentation

### Deterministic state model

Major actions are logged in the audit system:

- Project creation and updates
- Change request acceptance
- Release creation
- Specification updates
- Registry modifications

---

## Core components

### 1. Blueprint Editor

**Location:** `/editor` (private route; `/` is the marketing landing page)

**Features:**

- 2D blueprint canvas with grid system and snap-to-grid
- Wall, door, window, measure, label, dimension, room, MEP, furniture, landscape, terrain, Vastu tools
- Live 3D viewport (toggleable)
- Material picker and solar timeline scrubber

**State:** stored in the Project Manifest JSON. Full schema: [project-manifest-schema.md](./project-manifest-schema.md).

### 2. Governance framework

| Module | Route | Purpose |
|--------|-------|---------|
| Spec Center | `/spec-center` | Locked specifications with hash verification |
| Registry | `/registry` | Component, feature, and tool registry |
| Change Requests | `/change-requests` | Structured change workflow |
| Release Center | `/releases` | Multi-gate release pipeline |
| World Records | `/world-records` | Self-verified measurement evidence |
| Audit Log | `/audit` | Chronological event timeline |

Quick start: [GOVERNANCE_QUICKSTART.md](./GOVERNANCE_QUICKSTART.md)

---

## Documentation index

### Current state and inventory

| Document | Description |
|----------|-------------|
| [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md) | Supabase production addendum |
| [SOFTWARE_INVENTORY.md](./SOFTWARE_INVENTORY.md) | Technical inventory |
| [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) | Audited feature brief |

### Release and operations

| Document | Description |
|----------|-------------|
| [release/DEPLOYMENT.md](./release/DEPLOYMENT.md) | Production deployment |
| [release/VERCEL_ENV.md](./release/VERCEL_ENV.md) | Vercel env matrix |
| [release/SUPABASE_AUTH_SETUP.md](./release/SUPABASE_AUTH_SETUP.md) | Supabase auth setup |
| [release/STRIPE_SETUP.md](./release/STRIPE_SETUP.md) | Stripe billing rollout |
| [release/VERIFY_COMMANDS.md](./release/VERIFY_COMMANDS.md) | Local verification commands |
| [release/OPERATOR_CHECKLIST.md](./release/OPERATOR_CHECKLIST.md) | Launch checklist |

### Specifications and design

| Document | Description |
|----------|-------------|
| [specs/](./specs/) | Locked feature and architecture specs |
| [project-manifest-schema.md](./project-manifest-schema.md) | Manifest JSON schema |
| [route-manifest-schema.md](./route-manifest-schema.md) | Route manifest schema |
| [design/page-references/PAGE_REFERENCE.md](./design/page-references/PAGE_REFERENCE.md) | UI screenshot reference pack |
| [BRAND_LOCK.md](./BRAND_LOCK.md) | Gold workstation brand rules |

### User and developer guides

| Document | Description |
|----------|-------------|
| [user/GETTING_STARTED.md](./user/GETTING_STARTED.md) | Onboarding |
| [user/TOOL_REFERENCE.md](./user/TOOL_REFERENCE.md) | Tool reference |
| [user/KEYBOARD_SHORTCUTS.md](./user/KEYBOARD_SHORTCUTS.md) | Shortcuts |
| [developer/API.md](./developer/API.md) | Serverless API reference |

### Historical / v1.0 era

These remain for governance history but do not describe the current route map or Supabase backend:

- [SPEC.md](./SPEC.md), [REGISTRY.md](./REGISTRY.md), [RELEASE_v1.0.0.md](./RELEASE_v1.0.0.md)
- [prd.md](./prd.md) — original v1.0 PRD (editor was `/` in early scope)
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md), [STEP10_COMPLETE.md](./STEP10_COMPLETE.md)

Root-level `STEP*_*.md`, `PHASE2_*.md`, and `*_VERIFICATION*.md` files are point-in-time snapshots; see [../README.md](../README.md) for current status.

---

## Data model reference

### Project Manifest (summary)

```typescript
interface ProjectManifest {
  version: string;
  name: string;
  description?: string;
  walls: Wall[];
  openings: Opening[];
  materials: Material[];
  floorMaterial: string;
  lighting: LightingConfig;
  gridSize: number;
  snapToGrid: boolean;
  metadata: {
    created: string;
    modified: string;
    author?: string;
  };
}
```

See [project-manifest-schema.md](./project-manifest-schema.md) for the full schema.

### Wall

```typescript
interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number;
  height: number;
  material: string;
}
```

### Opening

```typescript
interface Opening {
  id: string;
  type: 'door' | 'window';
  wallId: string;
  position: number; // 0-1 along wall
  width: number;
  height: number;
  sillHeight?: number;
}
```

### Lighting configuration

```typescript
interface LightingConfig {
  sunAzimuth: number;
  sunElevation: number;
  timeOfDay: number;
  intensity: number;
}
```

---

## Verification

```bash
pnpm run verify:ci
pnpm run release:gates
pnpm run verify:supabase-schema
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
```

See [release/VERIFY_COMMANDS.md](./release/VERIFY_COMMANDS.md).

### Testing

| Document | Purpose |
|----------|---------|
| [testing/EDITOR_WORKFLOWS.md](./testing/EDITOR_WORKFLOWS.md) | Editor tool, selection, and radial menu workflow tests |
