# Vishvakarma.OS Final Cleanup Evidence

> **Historical evidence.** May 2026 cleanup snapshot. Current production backend is Supabase — see [CURRENT_PRODUCTION_ARCHITECTURE.md](../../CURRENT_PRODUCTION_ARCHITECTURE.md).

**Date:** 2026-05-31  
**Branch:** `upgrade/ui-ux-overhaul-20260528`  
**Commit:** `d80a0b5202614f55b4c2e516be941de0ca39e098` (pre-commit snapshot; includes uncommitted cleanup changes)

## Commands run

| Command | Status |
|---------|--------|
| `pnpm run lint` | Pass |
| `pnpm run build` | Pass (34s, `dist/` created, Viewport3D code-split) |
| `pnpm run test:routes` | Pass (4/4 route manifest tests) |
| `pnpm run test` | Pass — 42 files, 440/440 tests |
| `pnpm run verify:ci` | Lint + build + tests pass (run locally 2026-05-31) |

## Cleanup summary

### Honesty pass
- Auth: email-link only; Google/Apple disabled with "Coming soon"; password field removed; reset page explains email-link flow
- ToolRail: stub tools show disabled state + toast
- Export dialog: accurate format labels (JSON/PNG/PDF/DXF capabilities)
- Marketing copy aligned to product language (no AutoCAD/CFD overclaims)

### Manifest / no-drift
- Canonical JSON export via `projectExport.ts`
- Local draft saves full manifest (`buildDraftPayloadFromManifest`)
- `NewProjectDialog` uses `createProjectManifest`
- Import normalizes through `ImportModule.normalizeManifest`
- Grid size from manifest in editor canvas

### Backend / auth
- `SaveModeBadge` + `WorkspaceNotifications` show Firebase/Supabase/Local Draft
- Sign-out redirects to `/auth` (AppLayout + command palette)
- Firestore gateway unit tests added
- `backendStatus.missingKeys` exposed for UI

### Routes
- Added `/projects` (list, open, delete) and `/profile` (account + sign-out)
- 404 uses `MarketingLayout` with home/editor CTAs

### Editor / 3D
- `EditorCommandStrip` wired with props
- 3D atmosphere mode: persisted in localStorage; defaults to Standard on reduced-motion/low DPR
- Touch targets: editor icon buttons 44px min
- Welcome overlay dismiss always visible

## Routes verified (manifest + unit tests)

Public: `/`, `/features`, `/pricing`, `/auth`, `/reset-password`, `/404`  
Private: `/editor`, `/projects`, `/profile`, `/spec-center`, `/registry`, `/change-requests`, `/releases`, `/world-records`, `/audit`

## Screenshot pack

- [x] Automated pack script: `pnpm run test:screenshots` → [SCREENSHOT_PACK.md](./SCREENSHOT_PACK.md)
- [x] Partial captures: `01-landing-hero.png`, `02-auth-email-link.png` in `screenshots/`
- [ ] Items 03–07 pending editor render fix (React #185 on `/editor` in e2e preview)
- [ ] Manual items 8–12 (operator)

## Known limitations

Documented in detail:

- **Export formats:** [docs/user/EXPORT_LIMITATIONS.md](../../user/EXPORT_LIMITATIONS.md)
- **Stub tools (Room/Vastu/MEP/Furniture/Landscape):** [docs/user/STUB_TOOLS.md](../../user/STUB_TOOLS.md)

Summary:

- Google/Apple/password auth not implemented (labeled Coming soon)
- PNG export: walls only (no openings)
- PDF export: summary sheet, not CAD drawing
- DXF: basic LINE entities
- Room/Vastu/MEP/Furniture/Landscape tools visible but not on canvas yet
- Collaboration engine requires live Supabase Realtime
- `/projects` requires configured Supabase for cloud list (production path)

## Rollback plan

Revert in reverse phase order:
1. Routes/pages (`ProjectsPage`, `ProfilePage`, `routes.tsx`)
2. Backend messaging (`SaveModeBadge`, `WorkspaceNotifications`, `backendConfig`)
3. Manifest wiring (`EditorPage` export/draft, `localDraft.ts`, `import.ts`)
4. Auth/marketing honesty pass

## Next recommended build (superseded)

> Superseded by Supabase production cutover. Current next steps: [`OPERATOR_CHECKLIST.md`](../OPERATOR_CHECKLIST.md) and [`VERIFY_COMMANDS.md`](../VERIFY_COMMANDS.md).

1. Configure Supabase production env on Vercel (see [`VERCEL_ENV.md`](../VERCEL_ENV.md))
2. Manual demo loop: create project → draw walls/door/window → 3D Standard → save → export JSON → reload from `/projects`
3. Capture screenshot pack: `pnpm run test:screenshots` + manual items in [SCREENSHOT_PACK.md](./SCREENSHOT_PACK.md)
4. Run Playwright E2E on deployed preview

---

**Vishvakarma.OS is ready for demo only if the create/load → draw 2D → inspect 3D → save → export → reopen loop is verified.**
