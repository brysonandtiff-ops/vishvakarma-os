# Vishvakarma.OS — Page Reference Pack

Visual reference screenshots for every route and key UI state. Use these when designing or refactoring individual pages.

**Captured:** 2026-06-15 — regenerate after UI polish pass: `pnpm run capture:page-references`  
**Viewport:** iPad landscape 1194×834  
**Command:** `pnpm run capture:page-references`  
**Output:** `docs/design/page-references/`

## Regenerate

```bash
pnpm run test:e2e:install   # first time only
pnpm run capture:page-references
```

Governance remainder only (after a partial run):

```bash
SKIP_BUILD=1 PAGE_REF_REMAINDER=1 pnpm run capture:page-references
```

Build uses `VITE_E2E_ALLOW_LOCAL_ACCESS=true` and `VITE_PRICING_PAGE_ENABLED=true` so all routes are reachable without Supabase in E2E builds.

## Marketing (`marketing/`)

| Screenshot | Route | Source | Notes |
|------------|-------|--------|-------|
| [01-landing.png](./marketing/01-landing.png) | `/` | `src/pages/LandingPage.tsx` | fullPage |
| [02-features-guides.png](./marketing/02-features-guides.png) | `/features` | `src/pages/FeaturesPage.tsx` | Interactive Guides tab, fullPage |
| [03-features-all.png](./marketing/03-features-all.png) | `/features` | `src/pages/FeaturesPage.tsx` | All Features tab, fullPage |
| [04-auth.png](./marketing/04-auth.png) | `/auth` | `src/pages/AuthPage.tsx` | fullPage |
| [05-auth-reset-notice.png](./marketing/05-auth-reset-notice.png) | `/reset-password` → `/auth` | `src/pages/ResetPasswordPage.tsx` | Redirect notice on auth |
| [06-not-found.png](./marketing/06-not-found.png) | `*` (unknown path) | `src/pages/NotFound.tsx` | fullPage |
| [07-pricing.png](./marketing/07-pricing.png) | `/pricing` | `src/pages/PricingPage.tsx` | Enabled via `VITE_PRICING_PAGE_ENABLED`, fullPage |

## Editor (`editor/`)

| Screenshot | Route | Source | Notes |
|------------|-------|--------|-------|
| [08-welcome-overlay.png](./editor/08-welcome-overlay.png) | `/editor` | `src/components/editor/WelcomeOverlay.tsx` | First-visit overlay |
| [09-empty-2d.png](./editor/09-empty-2d.png) | `/editor` | `src/pages/EditorPage.tsx` | Empty canvas |
| [10-2d-sample.png](./editor/10-2d-sample.png) | `/editor` | `src/pages/EditorPage.tsx` | Sample house loaded |
| [11-3d-premium.png](./editor/11-3d-premium.png) | `/editor` | `src/components/editor/Viewport3D.tsx` | Premium atmosphere |
| [12-3d-standard.png](./editor/12-3d-standard.png) | `/editor` | `src/components/editor/Viewport3D.tsx` | Standard atmosphere |
| [13-3d-cinematic.png](./editor/13-3d-cinematic.png) | `/editor` | `src/components/editor/Viewport3D.tsx` | Cinematic atmosphere |
| [14-export-dialog.png](./editor/14-export-dialog.png) | `/editor` | `src/components/editor/ExportFloorPlanDialog.tsx` | Export Package dialog |
| [15-new-project-dialog.png](./editor/15-new-project-dialog.png) | `/editor` | `src/components/editor/NewProjectDialog.tsx` | |
| [16-open-project-dialog.png](./editor/16-open-project-dialog.png) | `/editor` | `src/components/editor/OpenProjectDialog.tsx` | |
| [17-import-dialog.png](./editor/17-import-dialog.png) | `/editor` | `src/components/editor/ImportFloorPlanDialog.tsx` | |
| [18-draft-recovery.png](./editor/18-draft-recovery.png) | `/editor` | `src/components/editor/DraftRecoveryDialog.tsx` | Seeded local draft |
| [19-local-draft-badge.png](./editor/19-local-draft-badge.png) | `/editor` | `src/components/editor/SaveStateBadge.tsx` | Local Draft badge |

## Workspace (`workspace/`)

| Screenshot | Route | Source | Notes |
|------------|-------|--------|-------|
| [20-projects-empty.png](./workspace/20-projects-empty.png) | `/projects` | `src/pages/ProjectsPage.tsx` | Empty list |
| [21-projects-populated.png](./workspace/21-projects-populated.png) | `/projects` | `src/pages/ProjectsPage.tsx` | After sample save |
| [22-profile.png](./workspace/22-profile.png) | `/profile` | `src/pages/ProfilePage.tsx` | Local workspace account |

## Governance (`governance/`)

| Screenshot | Route | Source | Notes |
|------------|-------|--------|-------|
| [23-spec-center.png](./governance/23-spec-center.png) | `/spec-center` | `src/pages/SpecCenterPage.tsx` | Local backend banner |
| [24-spec-new-dialog.png](./governance/24-spec-new-dialog.png) | `/spec-center` | `src/pages/SpecCenterPage.tsx` | View Full Spec dialog |
| [25-registry.png](./governance/25-registry.png) | `/registry` | `src/pages/RegistryPage.tsx` | |
| [26-registry-form.png](./governance/26-registry-form.png) | `/registry` | `src/pages/RegistryPage.tsx` | Disabled Register Entry CTA (local mode) |
| [27-change-requests.png](./governance/27-change-requests.png) | `/change-requests` | `src/pages/ChangeRequestsPage.tsx` | |
| [28-change-new-dialog.png](./governance/28-change-new-dialog.png) | `/change-requests` | `src/pages/ChangeRequestsPage.tsx` | Disabled New Request CTA (local mode) |
| [29-releases.png](./governance/29-releases.png) | `/releases` | `src/pages/ReleasesPage.tsx` | |
| [30-world-records.png](./governance/30-world-records.png) | `/world-records` | `src/pages/WorldRecordsPage.tsx` | |
| [31-audit.png](./governance/31-audit.png) | `/audit` | `src/pages/AuditLogPage.tsx` | |

## Manual captures (Supabase / production)

These states cannot be automated in the local e2e build:

| Target | Why manual | Steps |
|--------|------------|-------|
| `manual-cloud-save-badge.png` | Needs Supabase env | Deploy preview with Supabase configured, open `/editor` |
| `manual-projects-cloud.png` | Needs signed-in cloud save | Sign in, save project, open `/projects` with ≥1 row |
| `manual-registry-form-open.png` | Create dialog needs cloud | Supabase configured → `/registry` → Register Entry |
| `manual-change-request-open.png` | Create dialog needs cloud | Supabase configured → `/change-requests` → New Request |

See also [SCREENSHOT_PACK.md](../../release/evidence/SCREENSHOT_PACK.md) for release evidence captures.
