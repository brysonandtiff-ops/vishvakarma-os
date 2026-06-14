# Vishvakarma.OS — Product Capabilities

**Version:** v1.3.x  
**Last audited:** 2026-06-14  
**Current production backend:** Supabase Auth + Postgres/RLS + Storage + billing entitlement state  
**Canonical production URL:** https://vishvakarma-os.app  
**Vercel fallback URL:** https://vishvakarma-os.vercel.app

This document is the product capability brief aligned with the current production architecture. For backend status wording, see [`CURRENT_PRODUCTION_ARCHITECTURE.md`](./CURRENT_PRODUCTION_ARCHITECTURE.md).

---

## 1. 2D Blueprint Editor (`src/components/editor/`)

### Drawing and interaction

The 2D canvas is fully interactive and uses pointer events for mouse, touch, and Apple Pencil — an iPad-first workflow.

### Architectural tools

The ToolRail includes functional tools for selecting, drawing walls, placing doors/windows, labels, dimensions, furniture, MEP symbols, lighting fixtures, landscape assets, terrain patches, and Vastu overlays.

| Tool | Shortcut | Notes |
|------|----------|-------|
| Select | V | Inspect, drag openings and furniture |
| Wall | W | Tap start, tap end |
| Door / Window | D / N | Snap to walls |
| Label | T | Double-click to edit text |
| Measure / Dimension | M / ⇧M | Measurements and leader lines; visibility toggle supported |
| Furniture | F | Drag reposition, optional GLB model body |
| MEP | — | Outlet, switch, HVAC, panel, point/spot/ceiling fixtures |
| Landscape / Terrain | — | Landscape elements and elevated contour patches |
| Vastu | — | 8-direction harmony overlay |

### Precision drafting

- Snap-to-grid and endpoint snap for corner auto-joining.
- Gold corner-join ring (`#CF9B3A`) when wall endpoints snap during preview.
- Openings drag along walls with percentage-based parametric positioning and undo-safe commit on pointer up.
- Room perimeters use planar face extraction in `src/utils/roomCalculations.ts` with multi-room `detectRoomAtPoint` (smallest containing cycle) and polygon centroid labels.
- Canvas zoom/pan: wheel zoom (cursor-centered), shift/middle-button pan, on-canvas zoom badge, status-bar zoom readout, and reset view; viewport persisted via `manifest.camera`.
- Room tool assigns `roomType` and `floorIndex`; properties panel includes type picker and quick-type chips.
- Undo/redo is backed by the floor-plan engine history stack.

### iPad hardening

Current v1.2.x work includes iPad touch/keyboard/safe-area hardening, coarse touch-target CSS, upload UX improvements, PWA shell work, and expanded iPad audit tests.

---

## 2. Live 3D Viewport (`src/components/editor/Viewport3D.tsx`)

React Three Fiber and Three.js translate the 2D manifest into 3D geometry. Walls extrude, openings render as semi-transparent red doors and gold windows, fixtures emit point/spot lights, and the 3D surface remains resilient through WebGL pre-flight checks and an error boundary.

### 3D capability set

- Real-time 2D manifest → 3D model chamber with **dynamic scene origin** (wall bounding-box center, not fixed canvas center).
- Room volume slabs and ceiling planes at detected room centroids; stair meshes from `manifest.staircases`.
- Improved door/window geometry (wall notch + hinged panel / framed glass).
- Walk mode: first-person `PointerLockControls` on desktop; orbit controls remain on coarse-pointer (iPad) devices.
- Floor-scoped walls, openings, rooms, and fixtures in the 3D preview.
- Solar timeline: azimuth, elevation, intensity.
- Atmosphere modes: standard, premium, cinematic.
- Procedural PBR materials for walls, floors, furniture, and landscape.
- Phase 3 GLTF/GLB furniture and landscape model support with parametric fallback meshes.
- Phase 4 terrain patches: 2D contour drawing, elevation presets, and 3D extrusion.
- Service-worker/PWA shell support for stronger iPad usage.

---

## 3. Governance Operating System (`src/governance/`)

The Governance OS is a distinct enterprise-style product surface.

| Page | Route | Capability |
|------|-------|------------|
| Spec Center | `/spec-center` | Locked specs with SHA-256 hash verification |
| Registry | `/registry` | Component, feature, and tool registry |
| Change Requests | `/change-requests` | Structured change workflow |
| Release Center | `/releases` | 13-gate release pipeline and evidence packs |
| World Records | `/world-records` | Self-verified metric registry and measurement artifact |
| Audit Log | `/audit` | Immutable governance timeline |

The release-gate system is enforced through scripts and CI. World-record measurement evidence is generated with `pnpm run record:measure`.

---

## 4. Infrastructure and Data Persistence

### Supabase production backend

Current production architecture is consolidated around Supabase:

| Layer | Production path |
|-------|-----------------|
| Auth | Supabase Auth: email link + Google OAuth |
| Primary data | Supabase Postgres with RLS |
| Storage | Supabase Storage for uploaded/custom material textures |
| Billing entitlement state | Supabase-backed API route writes from Stripe webhooks |
| Profiles/projects/governance | Supabase gateway layer |
| Local fallback | `localStorage` for drafts/projects when Supabase is unconfigured |

Earlier Firebase/Firebase-admin work and Firestore migration utilities remain in the repository as portability and archive-recovery evidence. They should not be described as the current production backend unless Firebase runtime selection is intentionally restored in a later commit.

### Export pipeline

The Export Package dialog supports JSON, PNG, PDF, DXF, and SVG with layer toggles (rooms, furniture, dimensions). PNG/PDF/SVG use the shared floor-plan SVG builder path.

Import supports JSON (full manifest fidelity), Vishvakarma SVG round-trip, and basic DXF LINE/LWPOLYLINE walls with preview counts and warnings before apply.

| Format | Content |
|--------|---------|
| JSON | Full `ProjectManifest` round-trip |
| PNG | Rasterized plan — walls, openings, labels, dimensions |
| PDF | Visual floor plan + title block (A4/Letter) |
| DXF | Basic LINE entities |
| SVG | Vector floor plan |

---

## 5. Architecture Copilot

Architecture Copilot supports autonomous building-design workflows from uploaded inputs:

- Site survey / council docs / boundary input ingestion.
- Requirements extraction with Gemini and local parsers.
- Layout and floor-plan generation.
- Schedules, material list, cost estimate, compliance report.
- Permit package ZIP export.

Entry points include the Editor AI Designer flow and new-project workflows.

---

## 6. Design Optimization Engine

The optimization engine generates strategy-driven candidates and scores them across compliance, cost, energy, circulation, privacy, natural light, buildability, and related dimensions.

Current surfaces:

- `/optimization` dashboard.
- Candidate scoring and comparison.
- Winner promotion to editor.
- Cost, council, and permit-confidence signals.
- Batch persistence via Supabase or local fallback.

UI includes prototype disclaimers where appropriate.

---

## 7. Construction Cost Intelligence

Cost intelligence supports Copilot and optimization workflows:

- Material database and catalog.
- Regional cost indices.
- Labor rates.
- Supplier pricing tiers.
- Best/expected/worst-case scenarios.
- Confidence and risk scoring.

This is decision-support, not a certified quotation engine.

---

## 8. Council and Compliance Intelligence

Council intelligence parses planning signals such as setbacks and coverage from uploaded documents. Compliance rules include NCC/zoning/fire/energy/accessibility stubs and generate explainable findings.

Use cautious wording in public materials:

- Good: “pre-check,” “decision support,” “readiness indicator,” “prototype compliance assistant.”
- Avoid: “guaranteed approval,” “certified compliance,” “legal approval.”

---

## 9. Marketing and Monetization

Public surfaces:

- Landing page.
- Features page.
- Pricing page.
- Auth page.
- Profile/billing page.

Stripe integration includes Checkout, Customer Portal, webhooks, tier-based export gating, and billing verification scripts.

Published tiers:

| Tier | Price |
|------|------:|
| Starter | Free |
| Studio | $499/month |
| Enterprise | $1,000/month |

---

## 10. Quality and Verification

Recommended production verification:

```bash
pnpm install --frozen-lockfile
pnpm run hardening:gates
pnpm run auth:gates
pnpm run verify:supabase-schema
pnpm run verify:production-auth-flow
pnpm run verify:stripe-billing
pnpm run test
pnpm run build
```

Quality systems include Vitest, Playwright, route smoke, production auth checks, release gates, regression anchors, launch evidence, and hardening gates.

---

## Accuracy notes

| Stale wording | Correct current wording |
|---------------|-------------------------|
| Firebase production backend | Supabase production backend |
| Runtime-selectable Firebase/Supabase live architecture | Supabase-only production architecture with Firebase migration history |
| Firebase Storage for materials | Supabase Storage for uploaded/custom material textures |
| Firestore project persistence | Supabase Postgres/RLS project persistence |
| Firebase Realtime collaboration | Supabase metadata + preview Yjs/WebSocket collaboration server |
| Vercel subdomain as canonical production origin | `https://vishvakarma-os.app` as canonical production origin; Vercel subdomain as fallback/debug alias |

Update this document whenever the active production backend, auth provider flow, billing write path, canonical production origin, or editor capability set changes.
