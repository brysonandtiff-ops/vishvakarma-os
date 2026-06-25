# Vishvakarma.OS Post-READY Next 3 Proof Pack

Date: 2026-06-25
Branch: `test/post-ready-proof-pack`

## Scope

This proof pack creates the next three verification layers after route health, deep editor clickthrough, and demo project load proof.

## 1. Multi-user roles CI gate

File: `src/test/multiUserRolesCiGate.test.ts`

Run:

```bash
pnpm exec vitest run src/test/multiUserRolesCiGate.test.ts
```

What it proves:

- Role list remains stable.
- Strangers and read-only stakeholders cannot mutate projects.
- Owner remains the only billing/delete role.
- Co-owner can manage collaborators without becoming billing/delete authority.
- Unknown role inputs normalize to viewer instead of privileged access.

## 2. iPad real-device proof pipeline

Files:

- `docs/release/evidence/IPAD_10_REAL_DEVICE_PROOF.md`
- `docs/release/evidence/ipad-proof-checklist.md`
- `docs/release/evidence/ipad-recordings/.gitkeep`

What it proves:

- The project now has a repeatable real-device proof workflow for iPad 10 or equivalent iPadOS Safari hardware.
- The proof remains manual until a screen recording or human sign-off exists.

## 3. Long-session soak test

Files:

- `e2e/long-session-soak-proof.spec.ts`
- `playwright.soak.config.ts`

Fast smoke run:

```bash
pnpm exec playwright test --config=playwright.soak.config.ts
```

30-minute run:

```bash
VISH_SOAK_MS=1800000 pnpm exec playwright test --config=playwright.soak.config.ts
```

2-hour run:

```bash
VISH_SOAK_MS=7200000 pnpm exec playwright test --config=playwright.soak.config.ts
```

PowerShell examples:

```powershell
$env:VISH_SOAK_MS="1800000"
pnpm exec playwright test --config=playwright.soak.config.ts
```

```powershell
$env:VISH_SOAK_MS="7200000"
pnpm exec playwright test --config=playwright.soak.config.ts
```

What it proves:

- `/editor` remains mounted during the soak window.
- Editor top bar remains visible.
- Tool rail remains visible.
- Select, Wall, and Dimension still activate after waiting.
- Fatal/backend/config UI copy does not appear.

## Truth label

This pack adds proof infrastructure and automated gates for roles and long-session stability, plus a real iPad evidence pipeline. It does not claim live multi-user Supabase RLS, real iPad footage, or paid-user validation is complete until those evidence artifacts exist.
