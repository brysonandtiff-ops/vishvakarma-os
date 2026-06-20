# Functional Workflow Proof Matrix

Generated from commit: `042489f5a0e4a680c9838e35ed042d59351a3806`
Deployment URL: https://vishvakarma-os.app
Vercel fallback URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-20T05:25:35.663Z
Operator: automated local verify (issue #7)
Result: `FAIL`

## Purpose

Prove Vishvakarma.OS core workflows work end-to-end — not only that docs and build gates exist. This matrix maps each functional requirement from GitHub issue #7 to automated test coverage and evidence artifacts.

## Verification Commands

| Step | Command | Status |
|---|---|---|
| lint | `pnpm run lint` | PASS |
| functional wiring + logo brand | `vitest functionalWiring + officialLogoBrand` | PASS |
| unit tests | `pnpm run test` | FAIL |
| route smoke | `pnpm run test:routes` | PASS |
| build | `pnpm run build` | PASS |
| e2e gates | `pnpm run test:e2e (skipped)` | SKIPPED |
| release gates | `pnpm run release:gates` | SKIPPED |

## Workflow Matrix

| Workflow | Automated coverage | Evidence | Status |
|---|---|---|---|
| /auth secure access page renders and submits | functionalWiring.test.ts, e2e/auth-gate.spec.ts, e2e/auth-private-routes.spec.ts | Auth trust pillars, Google OAuth, secure access link wiring | PASS |
| Unauthenticated private routes redirect to /auth with return path | functionalWiring.test.ts, e2e/auth-private-routes.spec.ts, verify:production-auth-flow | RouteGuard + live production auth flow (15/15) | PASS |
| Authenticated/private app shell with official logo and navigation | functionalWiring.test.ts, officialLogoBrand.test.ts, e2e/workspace-navigation.spec.ts | OFFICIAL_LOGO_SRC on AuthPage + AppLayout | PASS |
| Every route in src/routes.tsx opens and renders intended page | routes.production.test.tsx, e2e/workspace-navigation.spec.ts, e2e/governance-smoke.spec.ts | 16 routes — route manifest parity test | PASS |
| Blueprint Editor: select tool, draw wall, add opening, inspect properties | e2e/editor-features.spec.ts, e2e/ipad-editor-layout.spec.ts | Sample project walls/openings, tool rail, 3D toggle, export dialog | PARTIAL |
| Save/load/export/import preserves project data | e2e/editor-features.spec.ts, save-load-proof.md, verify:supabase-save-reload, import/export unit tests | save-load-proof.md PASS — Supabase save/reload verified (4/3) | PASS |
| 2D model and 3D chamber stay in parity for wall/opening counts | 2d-3d-parity-proof.md, e2e/editor-features.spec.ts (3D toggle) | Sample House 01: 4 walls, 3 openings | PASS |
| Release Center and Audit Log show meaningful empty/loading states | e2e/governance-smoke.spec.ts, e2e/cross-browser-smoke.spec.ts | Release verification snapshot + audit primary actions | PARTIAL |
| iPad/coarse-pointer controls remain usable | e2e/ipad-production-readiness.spec.ts, ipad-touch-audit.md | Playwright tablet viewports + min 44px touch targets | PARTIAL |
| Browser metadata/PWA install icon uses official logo | officialLogoBrand.test.ts, contract:gates (check-pwa-install-assets.mjs) | manifest.webmanifest + apple-touch-icon + derived PNG icons | PASS |

## Command Output (summary)

### Lint

```txt
> vishvakarma-os@1.5.0 lint:deps C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live
> biome lint --only=correctness/noUndeclaredDependencies

Checked 721 files in 16s. No fixes applied.
 WARN  Unsupported engine: wanted: {"node":"20.x"} (current: {"node":"v24.13.1","pnpm":"9.15.0"})

> vishvakarma-os@1.5.0 lint:structure C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live
> ast-grep scan
```

### Functional wiring + logo brand

```txt
RUN  v4.1.9 C:/Users/bryso/dev/FUTURE PROJECTS/Vishvakarma-os/vishvakarma-os-live


 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  13:26:15
   Duration  11.54s (transform 728ms, setup 3.60s, import 506ms, tests 124ms, environment 10.85s)
```

### Unit tests

```txt
AssertionError: expected [ '/editor', '/projects', …(8) ] to include '/3d-room'
 ❯ src/test/workspaceCommandPalette.test.ts:29:27
     27|     expect(palettePaths).toEqual(privatePaths);
     28|     for (const path of palettePaths) {
     29|       expect(lockedPaths).toContain(path);
       |                           ^
     30|     }
     31|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

### Route smoke

```txt

 RUN  v4.1.9 C:/Users/bryso/dev/FUTURE PROJECTS/Vishvakarma-os/vishvakarma-os-live


 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  13:26:31
   Duration  8.71s (transform 1.09s, setup 1.37s, import 1.58s, tests 34ms, environment 3.09s)
```

### Build

```txt
✓ built in 20.91s

PWA v1.3.0
mode      generateSW
precache  172 entries (26087.32 KiB)
files generated
  dist/sw.js.map
  dist/sw.js
  dist/workbox-dcde9eb3.js.map
  dist/workbox-dcde9eb3.js
```

### E2E gates

```txt
Skipped (--skip-e2e)
```

### Release gates

```txt
Skipped (--skip-e2e)
```

## Stop-Ship Review

- Private routes must not bypass auth in production builds.
- Export/import must not corrupt the project model.
- Routes must render useful states, not empty shells.
- iPad/coarse-pointer interaction must remain usable.

## Verdict

```txt
FAIL — one or more verification commands failed or were skipped; see matrix above.
Cloud save/reload on Supabase: PASS (see save-load-proof.md + save-load-proof-run.json).
Attach green GitHub Actions URL to latest-ci-run.md for remote CI parity (#6 follow-up).
```
