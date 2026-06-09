# API Reference (Gateway Layer)

Vishvakarma.OS uses a thin Firebase gateway layer. All UI and editor code should call `src/db/api.ts` for persistence — not Firestore clients directly.

When Firebase env vars are missing, read operations return empty arrays and write operations throw with a configuration error.

---

## Projects — `src/db/api.ts`

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getProjects()` | — | `Promise<Project[]>` | List all projects for the signed-in user |
| `getProject(id)` | `id: string` | `Promise<Project \| null>` | Fetch a single project by id |
| `createProject(name, description, manifest)` | `name`, optional `description`, `ProjectManifest` | `Promise<Project>` | Create project + audit log entry |
| `updateProject(id, updates)` | `id`, partial `{ name, description, manifest }` | `Promise<Project>` | Update metadata/manifest + audit log |
| `deleteProject(id)` | `id: string` | `Promise<void>` | Delete project + audit log |

---

## Specs

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getSpecs()` | — | `Promise<Spec[]>` | All locked specifications |
| `getSpecsByCategory(category)` | `category: string` | `Promise<Spec[]>` | Filter specs by category |
| `createSpec(spec)` | `Omit<Spec, 'id' \| 'created_at' \| 'updated_at'>` | `Promise<Spec>` | Create spec + audit log |
| `updateSpec(id, updates)` | `id`, partial spec fields | `Promise<Spec>` | Update spec + audit log |

---

## Registry

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getRegistryEntries()` | — | `Promise<RegistryEntry[]>` | All registry entries |
| `getRegistryByType(type)` | `type: string` | `Promise<RegistryEntry[]>` | Filter by entry type |
| `createRegistryEntry(entry)` | `Omit<RegistryEntry, 'id' \| 'created_at'>` | `Promise<RegistryEntry>` | Create entry + audit log |

---

## Change Requests

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getChangeRequests()` | — | `Promise<ChangeRequest[]>` | All change requests |
| `getChangeRequestsByStatus(status)` | `status: string` | `Promise<ChangeRequest[]>` | Filter by workflow status |
| `createChangeRequest(request)` | request without id/timestamps | `Promise<ChangeRequest>` | Submit new CR + audit log |
| `updateChangeRequest(id, updates)` | `id`, partial fields | `Promise<ChangeRequest>` | Update status/details; logs approval |

---

## Releases

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getReleases()` | — | `Promise<Release[]>` | Firestore releases, or local fallback history |
| `getRelease(id)` | `id: string` | `Promise<Release \| null>` | Single release record |
| `createRelease(release)` | release without id/timestamps | `Promise<Release>` | Create release + audit log |
| `updateRelease(id, updates)` | `id`, partial fields | `Promise<Release>` | Update release metadata/status |

---

## Audit Logs

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getAuditLogs(limit?)` | `limit` default 100 | `Promise<AuditLog[]>` | Recent audit events |
| `getAuditLogsByEntity(type, id)` | entity type + id | `Promise<AuditLog[]>` | Events for a specific entity |
| `createAuditLog(action, entityType, entityId, details)` | action metadata | `Promise<AuditLog \| null>` | Internal write; fails silently when unconfigured |

---

## Route Manifest

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getRouteManifest()` | — | `Promise<RouteManifestEntry[]>` | Deployed route registry from Firestore |

---

## Backend Modules — `src/backend/`

| Module | Description |
|--------|-------------|
| `backendConfig.ts` | Reads `VITE_FIREBASE_*`, exposes `backendStatus.isConfigured` |
| `fetchWithRetry.ts` | Exponential backoff for Firestore REST calls |
| `firebase/firestoreProjectGateway.ts` | Low-level project CRUD |
| `firebase/firestoreGovernanceGateway.ts` | Specs, registry, releases, audit, route manifest |
| `firebase/firestoreProfileGateway.ts` | User profile reads/writes |
| `firebase/firebaseAuthGateway.ts` | Email link + OAuth session helpers |
| `firebase/storageUpload.ts` | Custom material texture upload to Firebase Storage |

---

## Export — `src/core/exporters/`

| Module | Formats | Notes |
|--------|---------|-------|
| `projectExport.ts` | JSON | Serialize/parse full `ProjectManifest` |
| `floorPlanSvg.ts` | SVG | Shared builder for walls, openings, labels, dimensions |
| `pngExport.ts` | PNG | Rasterized floor plan |
| `pdfExport.ts` | PDF | Visual raster + text manifest summary |
| `dxfExport.ts` | DXF | LINE entities for walls |

---

## Floor Plan Engine — `src/core/floorPlanEngine.ts`

Singleton editor state. React hooks consume via `useFloorPlanEngine()`.

| Method | Description |
|--------|-------------|
| `loadManifest(manifest, projectName?)` | Replace editor state; ensures default floors |
| `buildManifest()` | Current manifest snapshot for save/export |
| `addWall(wall)` | Adds wall tagged with active `floorIndex` |
| `setActiveFloorIndex(index)` | Switch visible floor (v2 scaffold) |
| `addFloor(name?)` | Append a new `BuildingFloor` and switch to it |
| `undo()` / `redo()` | Version-controlled history (50 states) |

Floor filtering helpers live in `src/utils/floorHelpers.ts`.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Production | Firebase Web SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production | Auth redirect domain |
| `VITE_FIREBASE_PROJECT_ID` | Production | Firestore project |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Texture uploads |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production | Firebase app id bundle |
| `VITE_FIREBASE_APP_ID` | Production | Firebase app id |
| `VITE_E2E_ALLOW_LOCAL_ACCESS` | E2E only | Bypass auth gate in Playwright |
| `VITE_PRICING_PAGE_ENABLED` | Optional | Register `/pricing` route |

See `docs/release/VERCEL_ENV.md` for production setup.
