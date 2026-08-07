# Latest CI / Local Verify Run

Generated from commit: `6abb1336fa37f62d420b90e231779224054fce72`
Generated at: 2026-08-07T12:58:54.037Z
Operator: automated local verify
Result: PASS — local lint, test, route smoke, build, and bundle budget succeeded

## Workflow Run

Local mirror of `.github/workflows/verify.yml` — attach GitHub Actions URL after push for remote proof.

## Command Parity

```bash
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run perf:gates
```

## Lint output (summary)

```txt
> vishvakarma-os@1.5.0 lint:deps C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live
> biome lint --only=correctness/noUndeclaredDependencies

Checked 747 files in 36s. No fixes applied.
 WARN  Unsupported engine: wanted: {"node":"20.x"} (current: {"node":"v24.18.1","pnpm":"9.15.0"})

> vishvakarma-os@1.5.0 lint:structure C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live
> ast-grep scan
```

## Unit test output (summary)

```txt
 [32m✓[39m visual-pack/pack/source/src/test/atmosphereMode.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/test/manifestGeometry.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 123[2mms[22m[39m
 [32m✓[39m visual-pack/pack/source/src/test/demoFlowDocs.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/test/canvasPointerCoords.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/test/stripeInvoice.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 142[2mms[22m[39m
 [32m✓[39m src/test/demoMediaKitHandoff.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m visual-pack/pack/source/src/test/copilotProofFlow.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 15[2mms[22m[39m

[2m Test Files [22m [1m[32m331 passed[39m[22m[90m (331)[39m
[2m      Tests [22m [1m[32m1782 passed[39m[22m[90m (1782)[39m
[2m   Start at [22m 21:00:03
[2m   Duration [22m 807.90s[2m (transform 58.72s, setup 555.98s, import 201.27s, tests 397.93s, environment 1661.24s)[22m
```

## Route smoke output (summary)

```txt

 [32m✓[39m src/routes.production.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m visual-pack/pack/source/src/routes.production.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[32m 37[2mms[22m[39m

[2m Test Files [22m [1m[32m2 passed[39m[22m[90m (2)[39m
[2m      Tests [22m [1m[32m14 passed[39m[22m[90m (14)[39m
[2m   Start at [22m 21:13:43
[2m   Duration [22m 16.58s[2m (transform 4.33s, setup 5.25s, import 6.55s, tests 80ms, environment 17.54s)[22m
```

## Build output (summary)

```txt
dist/assets/vendor-charts-Bx0qo6B7.js                                  397.74 kB │ gzip: 103.45 kB │ map: 1,642.26 kB
dist/assets/vendor-3d-text-BalsG9IO.js                                 810.08 kB │ gzip: 218.40 kB │ map: 3,280.20 kB
[32m✓ built in 34.92s[39m

PWA v1.3.0
mode      generateSW
precache  184 entries (32228.69 KiB)
files generated
  dist/sw.js.map
  dist/sw.js
  dist/workbox-dcde9eb3.js.map
  dist/workbox-dcde9eb3.js
```

## Artifact

- dist size: 0.00 MB
