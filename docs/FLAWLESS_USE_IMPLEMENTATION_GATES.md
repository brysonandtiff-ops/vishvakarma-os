# Vishvakarma.OS Flawless Use Implementation Gates

Use this file as the merge gate for value-building work.

## Required gates

- No duplicate geometry or project truth.
- No stale demo state in production workflow.
- No unclear save status.
- No silent work-loss path.
- No desktop-only core workflow interaction.
- No unlabeled critical controls.
- No export path that reads stale state.
- No product behavior change without docs and tests.

## Required PR fields

Every product-value PR must explain:

- STEP
- GOAL
- PLAN
- CHECK
- UPGRADE
- FIX
- WHAT YOU BUILD
- FILES
- VERIFY
- STOP
- RISKS
- ROLLBACK
- EVIDENCE

## Verification floor

```bash
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run verify:ci
```

## Highest-priority implementation gates

1. Canonical ProjectModel proof.
2. Save/load/recovery proof.
3. 2D blueprint editor hardening.
4. Live 2D to 3D sync proof.
5. Professional export proof.
6. iPad-first usability proof.
