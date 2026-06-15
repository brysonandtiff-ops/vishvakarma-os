# Testing Guide

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

When and how to run tests in Vishvakarma.OS.

Test inventory: [handoff/appendices/F-test-inventory.md](../handoff/appendices/F-test-inventory.md)

---

## Test pyramid

| Layer | Tool | Scope |
|-------|------|-------|
| Unit / integration | Vitest | Modules, gateways, manifest schema, governance |
| Route smoke | Vitest | Production route rendering (`test:routes`) |
| E2E | Playwright | Auth, editor, billing flows |
| Release gates | Custom scripts | 13-gate manifest, evidence, world record |

---

## Quick commands

```bash
pnpm run test              # Vitest unit/integration
pnpm run test:coverage     # With coverage (CI)
pnpm run test:routes       # Production route gate
pnpm run test:e2e          # Full Playwright suite
pnpm run test:e2e:auth     # Auth-specific E2E
pnpm run release:gates     # All release gates
pnpm run verify:ci         # CI-style subset
```

---

## When to run what

| Change type | Minimum |
|-------------|---------|
| Any code change | `pnpm run lint:types` |
| Components, pages, routes | `pnpm run test` + `pnpm run test:routes` |
| Editor tools / manifest | `pnpm run test` + see [EDITOR_WORKFLOWS.md](../testing/EDITOR_WORKFLOWS.md) |
| Auth / Supabase | `pnpm run verify:supabase-schema`, `verify:production-auth-flow` |
| Billing / Stripe | `pnpm run verify:stripe-billing` |
| Pre-merge | `pnpm run verify:ci` |
| Pre-release | `pnpm run release:gates` |

---

## Editor workflow tests

Manual and automated editor scenarios: [testing/EDITOR_WORKFLOWS.md](../testing/EDITOR_WORKFLOWS.md)

Covers tool rail, selection, radial menu, and manifest round-trips.

---

## E2E configuration

Playwright specs live in `e2e/`. Preview modes:

```bash
pnpm run preview:e2e        # Build + preview on :4173
pnpm run preview:e2e:local    # Local demo mode build
```

Cross-browser matrix runs in GitHub Actions (chromium, firefox, webkit).

---

## Evidence and gates

Release evidence artifacts: [release/evidence/](../release/evidence/)

Gate manifest: `src/governance/gates/gate-manifest.json`

Quality overview: [handoff/09-testing-quality-and-release.md](../handoff/09-testing-quality-and-release.md)

---

## Related

- [CI_CD.md](./CI_CD.md) — GitHub Actions workflows
- [ONBOARDING.md](./ONBOARDING.md) — first PR checklist
