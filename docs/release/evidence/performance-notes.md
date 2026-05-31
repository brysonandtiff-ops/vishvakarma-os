# Performance Notes

Generated at: 2026-05-31T12:00:00.000Z
Operator: automated local verify + Playwright iPad editor smoke
Result: PASS

## Build size

| Metric | Value |
|---|---|
| dist/ total | Run `pnpm run build` — vendor chunks: vendor-react, vendor-ui, vendor-3d, vendor-supabase |

## Runtime Interaction Checks

- Build completes under local verify pipeline.
- 3D vendor chunk isolated via `manualChunks` in vite.config.ts.
- Playwright iPad editor layout tests complete without timeout at 1180×820 and 820×1180.
- 3D panel toggle screenshot captured in `ipad-3d-panel.png`.

## Verdict

```txt
Result: PASS
```
