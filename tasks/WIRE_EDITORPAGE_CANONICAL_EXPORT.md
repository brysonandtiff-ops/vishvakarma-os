# Wire EditorPage to canonical project export

## Goal

Replace inline export logic in `src/pages/EditorPage.tsx` with the canonical export helpers from `src/core/projectExport.ts`.

## Required import

```ts
import { buildProjectExportFilename, serializeProjectManifest } from '@/core/projectExport';
```

## Required `handleExportJSON` logic

```ts
const manifest = buildManifest();
const dataStr = serializeProjectManifest(manifest);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = buildProjectExportFilename(manifest);
link.click();
URL.revokeObjectURL(url);
toast.success('Floor plan exported');
```

## Remove these inline patterns

```ts
JSON.stringify(manifest, null, 2)
`${manifest.name.replace(/\s+/g, '-').toLowerCase()}-floor-plan.json`
```

## Acceptance commands

```bash
pnpm run test src/core/projectExport.test.ts
node scripts/quality/check-editor-export-canonical.mjs
pnpm run lint
pnpm run test
pnpm run build
pnpm run verify:ci
```

## Stop conditions

Do not merge if:

- `EditorPage` still contains inline JSON stringify export logic.
- `EditorPage` still contains inline export filename slug logic.
- `check-editor-export-canonical.mjs` fails.
- Runtime export no longer downloads a JSON file.
- Exported JSON does not match the active ProjectManifest.

## Rollback

Revert only the `EditorPage` wiring patch. Keep `src/core/projectExport.ts`, its tests, and this guard script unless they are the source of the regression.
