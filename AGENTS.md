# Vishvakarma.OS — Agent Onboarding

Short onboarding for Cursor, ChatGPT, Codex, and other coding agents.

## Start here

1. [docs/handoff/CHATGPT_HANDOFF.md](./docs/handoff/CHATGPT_HANDOFF.md) — paste-ready product and codebase context
2. [docs/handoff/HANDOFF.md](./docs/handoff/HANDOFF.md) — valuation handoff index, annexes, appendices

## Workspace boundary

- **Work only in `vishvakarma-os-live/`** — this directory is the git root and contains all application code
- The parent `Vishvakarma-os/` folder is a thin workspace wrapper; do not create parallel app trees there

## Verify matrix

Run checks that match what you changed:

| Change type | Command |
|-------------|---------|
| Any code change | `pnpm run lint:types` |
| Logic, components, routes | `pnpm run test` (+ `pnpm run test:routes` if routes touched) |
| Build, config, deps | `pnpm run build` |
| Docs or handoff | `pnpm run handoff:verify` and `pnpm run docs:verify` |
| Before declaring done | `pnpm run verify:ci` |

Regenerate handoff appendices after inventory-affecting changes: `pnpm run handoff:generate`

## Truth hierarchy

When documents conflict:

1. Handoff pack + [docs/CURRENT_PRODUCTION_ARCHITECTURE.md](./docs/CURRENT_PRODUCTION_ARCHITECTURE.md)
2. [docs/SOFTWARE_INVENTORY.md](./docs/SOFTWARE_INVENTORY.md), [docs/PRODUCT_CAPABILITIES.md](./docs/PRODUCT_CAPABILITIES.md)
3. Auto-generated [docs/handoff/appendices/](./docs/handoff/appendices/) (from `pnpm run handoff:generate`)
4. [README.md](./README.md), [docs/README.md](./docs/README.md)
5. Historical step/build docs — lowest precedence

Production backend is **Supabase-only** (Auth, Postgres/RLS, Storage). Firebase artifacts are legacy migration tooling only.

## RepairBot

After substantive code edits, run RepairBot per [.cursor/rules/repairbot.mdc](./.cursor/rules/repairbot.mdc):

- `pnpm run repairbot:fast` — after routine edits
- `pnpm run repairbot:medium` — before declaring a feature done
- `pnpm run repairbot:full` — before push-level verification
- `pnpm run repairbot:status` — check repo health

Fix escalations before finishing. Do not auto-commit broken type or test failures.

## Agent rules and skills

- [.cursor/rules/](./.cursor/rules/) — Cursor rules (RepairBot, verify expectations)
- [.agents/skills/](./.agents/skills/) — vendored Supabase skills

## PARTIAL evidence — do not over-claim

These items are **PARTIAL** in launch evidence. Treat as blocked for production claims until upgraded to PASS:

| Item | Reference | Gap |
|------|-----------|-----|
| Blueprint editor: draw wall, opening, properties | [functional-workflow-proof.md](./docs/release/evidence/functional-workflow-proof.md) | E2E coverage incomplete for full editor workflow |
| Save/load/export/import data preservation | [save-load-proof.md](./docs/release/evidence/save-load-proof.md), functional-workflow-proof | Cloud reload on Supabase needs live operator proof |
| Release Center and Audit Log empty/loading states | functional-workflow-proof | Governance UI states not fully evidenced |
| iPad/coarse-pointer controls | [ipad-touch-audit.md](./docs/release/evidence/ipad-touch-audit.md), functional-workflow-proof | Touch audit PARTIAL beyond auth page layout |

**Resolved (was a gap):** Google OAuth sign-in — PASS in [auth-sign-in-proof.md](./docs/release/evidence/auth-sign-in-proof.md).

**Out of scope for doc-only agents:** Editor E2E React #185 and screenshot pack (P1 code work).

## Git policy

**Do not auto-commit or push** unless the user explicitly asks. Leave changes staged or unstaged for human review.
