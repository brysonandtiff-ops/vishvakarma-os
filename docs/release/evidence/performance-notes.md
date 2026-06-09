# Performance Notes

Generated from commit: `616d152ce659b8f7d7ed7098dbfc86c30a8e1296`
Deployment URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-09T14:38:46.000Z
Operator: Bryson Erdmann — local verify + Playwright iPad editor smoke + production load check
Result: PASS

## Build size

| Metric | Value |
|---|---|
| dist/ total | ~2.1 MB — vendor chunks: vendor-react, vendor-ui, vendor-3d, vendor-firebase |

## Runtime Interaction Checks

- Build completes under local verify pipeline.
- 3D vendor chunk isolated via `manualChunks` in vite.config.ts.
- Playwright iPad editor layout tests complete without timeout at 1180×820 and 820×1180.
- 3D panel toggle screenshot captured in `ipad-3d-panel.png`.
- Production URL `https://vishvakarma-os.vercel.app` returns 200 with HSTS/CSP under 2s on broadband.
- 3D toggle on sample project completes under 2s in Playwright smoke.
- 50-wall stress project interaction responsive in unit/integration tests.

## Verdict

```txt
Result: PASS
```
