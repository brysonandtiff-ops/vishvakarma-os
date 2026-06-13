# Annex 04 — Application Surface

[← Handoff index](./HANDOFF.md)

**Route source of truth:** [`src/routes.tsx`](../../src/routes.tsx)  
**Auto-generated route list:** [Appendix A](./appendices/A-routes-and-api.md)

## Public routes

| Path | Page | Notes |
|------|------|-------|
| `/` | LandingPage | Marketing home |
| `/features` | FeaturesPage | Product catalog |
| `/pricing` | PricingPage | Only when `VITE_PRICING_PAGE_ENABLED=true` |
| `/auth` | AuthPage | Email link + Google/Apple OAuth |
| `/reset-password` | ResetPasswordPage | Password reset |
| `/404` | NotFound | Branded not-found |

## Private routes (auth required)

| Path | Page | Domain |
|------|------|--------|
| `/editor` | EditorPage | 2D blueprint + 3D viewport |
| `/projects` | ProjectsPage | Cloud/local project library |
| `/optimization` | OptimizationPage | Design optimization dashboard |
| `/profile` | ProfilePage | Account + Stripe billing |
| `/spec-center` | SpecCenterPage | Locked specs (SHA-256) |
| `/registry` | RegistryPage | Component/feature/tool registry |
| `/change-requests` | ChangeRequestsPage | Governed change workflow |
| `/releases` | ReleasesPage | 13-gate release center |
| `/world-records` | WorldRecordsPage | Self-verified gate-count registry |
| `/audit` | AuditLogPage | Governance audit timeline |

Catch-all `*` → NotFound ([`src/App.tsx`](../../src/App.tsx)).

Route protection: [`src/components/common/RouteGuard.tsx`](../../src/components/common/RouteGuard.tsx) — no Next.js middleware.

## Feature modules

### 2D Blueprint Editor — Production

- Page: [`src/pages/EditorPage.tsx`](../../src/pages/EditorPage.tsx)
- Engine: [`src/core/floorPlanEngine.ts`](../../src/core/floorPlanEngine.ts)
- Components: [`src/components/editor/`](../../src/components/editor/) (36+ files)
- Onboarding: [`src/components/editor/OnboardingPanel.tsx`](../../src/components/editor/OnboardingPanel.tsx), [`src/editor/onboardingMemory.ts`](../../src/editor/onboardingMemory.ts)

### Live 3D Viewport — Production

- [`src/components/editor/Viewport3D.tsx`](../../src/components/editor/Viewport3D.tsx)
- Three.js/R3F, solar timeline, atmosphere modes, GLB models ([`public/models/`](../../public/models/))

### AI Architecture Copilot — Built (requires API key)

- UI: [`src/components/editor/ai-designer/`](../../src/components/editor/ai-designer/)
- Pipeline: [`src/ai/building-designer/`](../../src/ai/building-designer/), [`src/services/floorplan-generation/`](../../src/services/floorplan-generation/)
- Server: [`api/ai/*`](../../api/ai/)

### Design Optimization — Built (prototype disclaimers)

- [`src/pages/OptimizationPage.tsx`](../../src/pages/OptimizationPage.tsx)
- [`src/services/optimization/`](../../src/services/optimization/)

### Compliance / Council / Cost — Built (decision-support)

- [`src/modules/compliance/`](../../src/modules/compliance/)
- [`src/services/council-intelligence/`](../../src/services/council-intelligence/)
- [`src/services/cost-estimation/`](../../src/services/cost-estimation/)

### Governance OS — Production

- Pages listed above under private routes
- DB: [`src/db/api.ts`](../../src/db/api.ts) → governance gateway

### Collaboration — Preview scaffold

- [`src/collaboration/`](../../src/collaboration/), [`src/modules/collaborationEngine.ts`](../../src/modules/collaborationEngine.ts)
- E2E: [`e2e/collaboration-sync.spec.ts`](../../e2e/collaboration-sync.spec.ts)

### Billing — Production

- [`src/pages/PricingPage.tsx`](../../src/pages/PricingPage.tsx), [`src/hooks/useBilling.ts`](../../src/hooks/useBilling.ts)
- Stripe API routes under [`api/stripe/`](../../api/stripe/)

## Export pipeline

| Format | Tier gating |
|--------|-------------|
| JSON | Studio+ (full manifest round-trip) |
| SVG, PNG, PDF, DXF | Tier-gated via `usePlanTier` / `resolveExportTier` |
| ZIP permit package | Compliance-gated paths |

Exporters: [`src/core/`](../../src/core/) (exporters), [`src/modules/`](../../src/modules/)

User limitations: [`docs/user/EXPORT_LIMITATIONS.md`](../user/EXPORT_LIMITATIONS.md)

## Deep inventory

Full module inventory: [`docs/SOFTWARE_INVENTORY.md`](../SOFTWARE_INVENTORY.md) §4–8.

Developer API reference: [`docs/developer/API.md`](../developer/API.md)
