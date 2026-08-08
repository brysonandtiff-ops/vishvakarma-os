# Long-Session Editor Soak Proof

Result: `PASS` (fast soak — 60s automated window)

## Purpose

Prove the blueprint editor shell stays responsive after an idle soak window: top bar and tool rail remain visible, no fatal/backend copy appears, and core tools still activate.

## Automated coverage

| Artifact | Command |
|---|---|
| Playwright spec | `e2e/long-session-soak-proof.spec.ts` |
| Config | `playwright.soak.config.ts` |
| Local run | `pnpm run test:e2e:soak` |
| CI (main push) | `.github/workflows/e2e.yml` job `soak-proof` with `VISH_SOAK_MS=60000` |
| Extended soak | workflow_dispatch on E2E Proofs with `soak_minutes` input |

## Fast soak behavior

1. Seed Supabase session stub and dismiss guided start / analytics / draft recovery overlays.
2. Open `/editor` and assert `editor-top-bar` + `tool-rail` visible.
3. Wait `VISH_SOAK_MS` (default 60_000 ms).
4. Re-assert chrome visible; activate Select, Wall, and Dimension tools via synthetic click.
5. Assert body does not contain backend/config fatal copy.

## Extended soak (operator)

For 30+ minute sessions, run locally or via CI workflow_dispatch:

```bash
# 30 minutes locally
$env:VISH_SOAK_MS="1800000"; pnpm run test:e2e:soak
```

Extended runs are not required for routine release gates; attach Playwright report artifact when used for launch evidence.

## Truth label

- **60s fast soak:** automated PASS when `pnpm run test:e2e:soak` is green.
- **30+ min extended soak:** PARTIAL until an operator runs workflow_dispatch (or local) and attaches the report artifact.
