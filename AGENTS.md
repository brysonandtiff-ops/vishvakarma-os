# Vishvakarma.OS — Agent Onboarding

Short onboarding for Cursor, ChatGPT, Codex, and other coding agents working in this repo.

## Start here

1. **This file** — verify, ship, precedence, auth gotchas
2. [docs/handoff/CHATGPT_HANDOFF.md](./docs/handoff/CHATGPT_HANDOFF.md) — paste-ready product and codebase context
3. [docs/handoff/HANDOFF.md](./docs/handoff/HANDOFF.md) — valuation handoff index, annexes, appendices

## Workspace boundary

- **Work only in `vishvakarma-os-live/`** — this directory is the git root and contains all application code
- The parent `Vishvakarma-os/` folder is a thin workspace wrapper; do not create parallel app trees there
- Open Cursor at `vishvakarma-os-live` when possible so hooks resolve the correct git root

## Instruction precedence

When agent instructions conflict, use this order:

| Priority | Source | Applies when |
|----------|--------|--------------|
| 1 | **User message in the current turn** | Explicit overrides win (e.g. “do not commit”, “only explain”) |
| 2 | **[`.cursor/rules/auto-finish.mdc`](./.cursor/rules/auto-finish.mdc)** | Build/change tasks in this repo — verify and ship by default |
| 3 | **This file (`AGENTS.md`)** | Onboarding, verify matrix, auth gotchas, evidence limits |
| 4 | **[`.cursor/rules/repairbot.mdc`](./.cursor/rules/repairbot.mdc)** | RepairBot tiers after substantive code edits |
| 5 | Global Cursor user rules | Generic commit/PR habits — **superseded here** for routine build tasks |

**Ship default:** For implementation tasks, hooks + auto-finish commit and push after `lint:types` passes. Do not ask permission to ship at the end. Skip ship only when the user explicitly says not to commit/push **in the same message**.

**Manual git:** Do not run `git commit` / `git push` during normal agent work — [auto-ship hooks](./docs/operations/AUTO_SHIP_HOOKS.md) handle it. Use git manually only when fixing auto-ship failures or when `VISH_AUTO_SHIP=0`.

## Verify matrix

Run checks that match what you changed:

| Change type | Command |
|-------------|---------|
| Any code change | `pnpm run lint:types` |
| Logic, components, routes | `pnpm run test` (+ `pnpm run test:routes` if routes touched) |
| Build, config, deps | `pnpm run build` |
| Auth / Supabase | `pnpm run auth:gates`, `pnpm run test:supabase-auth` |
| Billing / Stripe | `pnpm run verify:stripe-billing` (when env allows) |
| Docs or handoff | `pnpm run handoff:verify` and `pnpm run docs:verify` |
| Before declaring a feature done | `pnpm run repairbot:medium` or `pnpm run verify:ci` |
| Pre-release / governance ship | `pnpm run repairbot:world` (needs Supabase env) |

Regenerate handoff appendices after inventory-affecting changes: `pnpm run handoff:generate`

### Pipeline tiers

Unified runner: `node scripts/run-pipeline.mjs --tier=<name>` (alias: `pnpm run pipeline -- --tier=<name>`).

| Tier | Command | When to use |
|------|---------|-------------|
| `verify` | `pnpm run verify` | Local pre-push — lint, gates, test, build, perf |
| `verify:ci` | `pnpm run verify:ci` | Pre-deploy — adds `test:routes` |
| `ci` | `pnpm run ci` | Full GitHub Actions parity (needs live Supabase env for some steps) |
| `release` | `pnpm run release:gates` | 13-gate release manifest |
| `post-deploy` | `pnpm run stability:post-deploy` | Production smoke after Vercel deploy |
| `repairbot:fast` | `pnpm run repairbot:fast` | After routine edits |
| `repairbot:medium` | `pnpm run repairbot:medium` | Before declaring a feature done |
| `repairbot:full` | `pnpm run repairbot:full` | Push-level verification (verify + env preflight) |
| `repairbot:world` | `pnpm run repairbot:world` | Pre-release — CI + release gates + world-record evidence |

Manifest: [`scripts/lib/pipeline-manifest.json`](./scripts/lib/pipeline-manifest.json). Appendix: [docs/handoff/appendices/E-verify-scripts.md](./docs/handoff/appendices/E-verify-scripts.md).

## How to ship

1. Make changes; run the verify matrix above for your change type
2. **Auto-ship hooks** (if enabled): debounce → `git status` → `pnpm run lint:types` → commit → `git push origin HEAD`
3. Report: what shipped, checks run, commit SHA (or blocker)

| Action | Command |
|--------|---------|
| Ship now (manual) | `pnpm run auto-ship` |
| Preview without commit | `pnpm run auto-ship:dry` |
| Disable hooks | `$env:VISH_AUTO_SHIP="0"` (PowerShell) or `set VISH_AUTO_SHIP=0` (CMD) |
| Install user-global hooks | `pnpm run auto-ship:install-user` then restart Cursor |
| Logs | `.cursor/auto-ship/run.log` (gitignored) |

Full operator doc: [docs/operations/AUTO_SHIP_HOOKS.md](./docs/operations/AUTO_SHIP_HOOKS.md)

### Windows / PowerShell

- Use `Set-Location path; command` — older PowerShell does not support `&&`
- Hooks invoke `node` directly; ensure Node 20+ and `git` are on `PATH`
- Auto-ship runs `pnpm.cmd` with shell for lint on Windows

## Auth gotchas (Supabase + Google OAuth)

Production auth is **Supabase-only**. Common agent mistakes:

| Gotcha | Fix |
|--------|-----|
| Placeholder anon key | Replace `your-supabase-anon-key` in `.env.local` — copy from Supabase Dashboard → API |
| Wrong redirect origin | `VITE_AUTH_REDIRECT_ORIGIN` must match the browser origin (`https://vishvakarma-os.app` prod; `http://127.0.0.1:5173` local) |
| Google OAuth redirect | Google Cloud client needs `https://jyocvwipthswfcmvqgqe.supabase.co/auth/v1/callback` |
| Supabase redirect URLs | Dashboard → Auth → URL config must list `/auth` and `/editor` for each origin |
| `VITE_*` not updating after env change | Vite inlines at **build time** — redeploy Vercel after env edits |
| Legacy Firebase vars | Remove `VITE_FIREBASE_*` / `VITE_BACKEND_PROVIDER` from Vercel if present |

Template: [`.env.example`](./.env.example). Operator setup: [docs/release/SUPABASE_AUTH_SETUP.md](./docs/release/SUPABASE_AUTH_SETUP.md), [docs/release/VERCEL_ENV.md](./docs/release/VERCEL_ENV.md).

Verify auth changes:

```bash
pnpm run auth:gates
pnpm run test:supabase-auth
pnpm run verify:production-auth-flow   # when env allows
```

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
- `pnpm run repairbot:full` — before push-level verification (verify + env preflight)
- `pnpm run repairbot:world` — pre-release CI + release gates + world-record evidence (needs Supabase env)
- `pnpm run repairbot:status` — check repo health

Fix escalations before finishing. Do not ship broken type or test failures — lint blocks auto-ship.

## Agent rules and skills

- [.cursor/rules/](./.cursor/rules/) — Cursor rules (auto-finish, RepairBot)
- [.agents/skills/](./.agents/skills/) — vendored Supabase skills

## PARTIAL evidence — do not over-claim

These items are **PARTIAL** in launch evidence. Treat as blocked for production claims until upgraded to PASS:

| Item | Reference | Gap |
|------|-----------|-----|
| Collaboration preview touch chrome | [collaboration-preview-hardening.md](./docs/release/evidence/collaboration-preview-hardening.md) | Preview-only — not production co-editing |
| Physical iPad Safari screen recordings | [IPAD_10_REAL_DEVICE_PROOF.md](./docs/release/evidence/IPAD_10_REAL_DEVICE_PROOF.md) | Automated viewport PASS; real-device Home Screen + Pencil draw remain operator-only |
| Extended long-session soak (30+ min) | [long-session-soak-proof.md](./docs/release/evidence/long-session-soak-proof.md) | Fast 60s soak automated; extended soak via workflow_dispatch only |

**Resolved (was a gap):** Blueprint editor draw wall/opening/properties — PASS via `e2e/editor-draw-workflow-proof.spec.ts` + deep proof CI job.

**Resolved (was a gap):** Save/load/export/import — PASS in [save-load-proof.md](./docs/release/evidence/save-load-proof.md).

**Resolved (was a gap):** Release Center and Audit Log empty/loading states — PASS via `e2e/governance-smoke.spec.ts`.

**Resolved (was a gap):** Google OAuth sign-in — PASS in [auth-sign-in-proof.md](./docs/release/evidence/auth-sign-in-proof.md).

**Resolved (was a gap):** iPad/coarse-pointer controls (automated) — PASS in [device-hardening-audit.md](./docs/release/evidence/device-hardening-audit.md). Physical iPad Home Screen install and Pencil draw remain manual — see [DEVICE_HARDENING_RUNBOOK.md](./docs/release/DEVICE_HARDENING_RUNBOOK.md).

**Out of scope for doc-only agents:** Editor E2E React #185 and screenshot pack (P1 code work).

## Cursor Cloud specific instructions

Durable, non-obvious notes for cloud agents (the update script already installs dependencies).

- **Repo root:** In the cloud VM, the app lives directly at the workspace root (`/workspace`) — there is no nested `vishvakarma-os-live/` directory here, despite the "Workspace boundary" note above. Run all commands from the repo root.
- **Node:** `engines` pins Node `20.x`, but the VM default is Node 22 and there is no `engine-strict`, so install/lint/test/build/dev all work on Node 22 (pnpm only prints an "Unsupported engine" warning). No `nvm` juggling is required.
- **Run the app (dev):** `pnpm run dev` serves the SPA at `http://127.0.0.1:5173`. The app boots **without any backend** — `RouteGuard` allows local access when Supabase is unconfigured. To force-bypass the auth gate, set `VITE_ALLOW_LOCAL_DEMO=true` in a gitignored `.env.local`. The editor is at `/editor` (the "START FREE" button routes to `/auth`).
- **Editor canvas layout:** The editor shell (`.vish-editor-shell`) must be a flex column. It was previously `display: grid` (in `src/styles/vish-editor-polish.css`), whose `1fr` canvas column collapsed to `0px` and hid the blueprint — fixed. If the blueprint canvas ever renders blank again, first check that the shell's canvas column/stage has non-zero width (the failure mode is a grid/flex layout regression, not a 2D-drawing bug).
- **Verifying editor functionality:** Verify drawing via the `.ws-status-bar` `Walls:`/`Openings:` counters and the E2E draw proof: `pnpm exec playwright test --config=playwright.deep-proof.config.ts` (draws a wall, places a door, asserts wall properties). Tools activate via the tool rail buttons or keyboard (`W` = Wall).
- **3D viewport needs WebGL:** In headless/GPU-less environments the 3D pane falls back to a "3D Preview Unavailable" panel, and screenshot specs that click "toggle 3d view" can fail at that step. This is expected; it does not indicate a broken 2D editor.
- **E2E browsers:** Playwright browsers are not part of the dependency install. Install on demand with `pnpm exec playwright install --with-deps chromium` (add `firefox webkit` for cross-browser). The deep-proof, screenshot, and app-smoke configs build and serve their own preview on `http://127.0.0.1:4173` (`preview:e2e:local`); pass `PLAYWRIGHT_REUSE_SERVER=1` to reuse an already-running preview.
- **Full unit suite is slow:** `pnpm run test` runs ~900 tests across ~166 files and takes ~3 minutes — run it in the background and poll rather than blocking. `AppErrorBoundary.test.tsx` intentionally throws "Test render failure" to stderr; that is expected, not a failure.
- **Auto-ship hooks push to the current branch:** The `.cursor/hooks.json` auto-ship hooks commit and `git push origin HEAD` after edits/shell/stop. Work on a `cursor/*` feature branch (not `main`) so routine edits and even test-regenerated artifacts (e.g. `docs/release/evidence/*perf*`, `docs/demo/screenshots/*`) land on the branch instead of `main`.
