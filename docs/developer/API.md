# API Reference (Gateway Layer)

## Projects — `src/db/api.ts`

| Function | Description |
|----------|-------------|
| `getProjects()` | List user projects from Firestore |
| `getProject(id)` | Fetch single project |
| `createProject(name, description, manifest)` | Create project document |
| `updateProject(id, updates)` | Update manifest/metadata |
| `deleteProject(id)` | Remove project |

Requires Firebase configuration (`VITE_FIREBASE_*`). Returns empty/local when unconfigured.

## Backend — `src/backend/`

| Module | Description |
|--------|-------------|
| `backendConfig.ts` | Firebase env validation |
| `fetchWithRetry.ts` | Exponential backoff for Firestore REST |
| `firebase/firestoreProjectGateway.ts` | Project CRUD |
| `firebase/firestoreGovernanceGateway.ts` | Specs, registry, releases, audit |

## Export — `src/core/exporters/`

| Module | Formats |
|--------|---------|
| `projectExport.ts` | JSON serialize/parse |
| `pdfExport.ts` | Visual + text PDF |
| `pngExport.ts` | PNG raster |
| `dxfExport.ts` | DXF LINE export |
