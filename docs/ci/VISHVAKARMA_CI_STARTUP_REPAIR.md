# Vishvakarma CI startup repair

## Scope

This repair is CI-only. It exists to stabilize the GitHub Actions startup path after issue #76 reported repeated `startup_failure` runs on the PR #75 head commit.

## Changes

- Renamed the workflow from `SkySentinel CI` to `Vishvakarma CI`.
- Added `workflow_dispatch` so the pipeline can be manually re-run after a repair.
- Added explicit top-level permissions:
  - `contents: read`
  - `actions: read`
- Added explicit preview deploy job permissions:
  - `contents: read`
  - `pull-requests: write`
- Aligned pnpm in CI from `9` to `10.28.2`, matching `packageManager: pnpm@10.28.2`.
- Upgraded `pnpm/action-setup` from `v3` to `v4`.
- Changed `actions/setup-node` from `v6` to the stable maintained `v4` line.

## Device hardening evidence carried into this release lane

The CI fix protects the device-hardening work that just landed for Vishvakarma.OS:

- Dynamic viewport normalization across app shell, auth gates, governance, and editor surfaces.
- iOS bouncy-scroll prevention through app-style workspace locking.
- Safe-area hardening for iPad 10 portrait and landscape.
- Touch readiness around 44x44px expectations.

## Guardrails

- No product route changes.
- No auth behavior changes.
- No Supabase or schema changes.
- No editor behavior changes.
- No visual redesign changes.

## Validation target

This branch should prove that GitHub Actions starts normally again. If the workflow starts but later fails on a regular test, build, Playwright, or Vercel step, that should be handled as a separate normal CI failure instead of a startup failure.
