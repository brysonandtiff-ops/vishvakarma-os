# Performance Notes

Generated from commit: `44a5863faf32b1f14175f69968ac0d2f6dce1236`
Generated at: 2026-06-14T07:04:51.594Z
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
