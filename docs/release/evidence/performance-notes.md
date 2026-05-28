# Performance Notes

Generated from commit: `88c9854fb8159e63f5c672957731f8d2a30a945a`
Generated at: 2026-05-28T21:23:06.073Z
Operator: automated local verify
Result: PASS — build artifact produced locally

## Build size

| Metric | Value |
|---|---|
| dist/ total | Run `pnpm run production:evidence` to refresh |

## Runtime Interaction Checks

- Build completes under local verify pipeline.
- 3D vendor chunk isolated via `manualChunks` in vite.config.ts.
- Manual iPad interaction and 3D update latency still require device evidence.
