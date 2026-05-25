# Pull Request

## Product value

Describe the user value this PR adds.

-

## Build doctrine

Complete these fields before review:

- STEP:
- GOAL:
- PLAN:
- CHECK:
- UPGRADE:
- FIX:
- WHAT YOU BUILD:
- FILES:
- VERIFY:
- STOP:
- RISKS:
- ROLLBACK:
- EVIDENCE:

## Flawless-use impact

- [ ] ProjectModel / canonical state
- [ ] Save/load/recovery
- [ ] 2D blueprint editor
- [ ] Door/window binding
- [ ] Measurements
- [ ] Undo/redo
- [ ] 2D to 3D sync
- [ ] 3D viewport / WebGL fallback
- [ ] Solar/material controls
- [ ] Export/reporting
- [ ] iPad/touch UX
- [ ] Accessibility
- [ ] Performance
- [ ] Governance/docs only

## Stop-ship checks

- [ ] No duplicate project/geometry truth introduced
- [ ] No stale demo/sample state used by production workflow
- [ ] No user work-loss path introduced
- [ ] No desktop-only core workflow introduced
- [ ] No unlabeled critical interactive controls introduced
- [ ] No export path reads stale or fake state
- [ ] No product behavior changed without updated tests/docs

## Verification

```bash
pnpm run lint
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run verify:ci
```

## Evidence

- [ ] Screenshots or recording
- [ ] Terminal verification output
- [ ] User workflow tested
- [ ] Known limitations listed

## Rollback

-
