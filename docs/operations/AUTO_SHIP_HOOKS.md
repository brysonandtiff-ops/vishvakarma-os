# Auto-ship hooks (Cursor)

Mechanical **check → commit → push** pipeline triggered by Cursor hooks after agent shell commands, mutating tools, file edits, and agent turn end.

## Enable

### Project hooks (repo)

Already configured in [`.cursor/hooks.json`](../../.cursor/hooks.json). Restart Cursor after pull.

### User-global hooks (all workspaces)

From repo root:

```bash
pnpm run auto-ship:install-user
```

Installs merged entries into `%USERPROFILE%\.cursor\hooks.json` (Windows) or `~/.cursor/hooks.json`.

Restart Cursor and confirm **Settings → Hooks** shows:

- `afterShellExecution`
- `postToolUse`
- `afterFileEdit` (Biome lint on project hooks only; auto-ship on both)
- `stop`

User-global hooks resolve the git repo from `process.cwd()` — open the **`vishvakarma-os-live`** folder as the Cursor workspace root when using them.

## Pipeline

1. Recursion guard — skip commands matching [`auto-ship-config.json`](../../scripts/auto-ship/auto-ship-config.json) `skipCommandPatterns` (auto-ship, git commit/push/add/status/…, `pnpm run lint:types|test|auto-ship`, vitest)
2. Non-zero shell exit code — skip ship
3. Debounce lock (10s) — fast read at entry; lock written immediately before lint to batch concurrent hooks
4. `git status --porcelain` — exit if clean or only excluded paths
5. Exclude secrets/artifacts (`.env*`, exports, caches — see config)
6. **`pnpm run lint:types`** — **blocks commit on failure** (lock released on lint fail so retry is not debounced away)
7. `git add` safe paths → `git commit` → `git push origin HEAD`

## Manual commands

```bash
pnpm run auto-ship          # run pipeline now
pnpm run auto-ship:dry       # log what would ship, no commit
```

## Disable

```bash
set VISH_AUTO_SHIP=0        # Windows CMD
$env:VISH_AUTO_SHIP="0"     # PowerShell (session)
export VISH_AUTO_SHIP=0     # macOS/Linux
```

## Windows / PowerShell

- Hooks run `node` directly — Node 20+ and `git` must be on `PATH`
- Auto-ship invokes `pnpm.cmd` with shell for `lint:types`
- Git porcelain paths with backslashes or quotes are normalized before staging
- In agent shell commands, use `Set-Location path; command` — older PowerShell does not support `&&`
- Project hooks resolve the repo from `.cursor/hooks/` first (nested wrapper + app repo both have `.git` safe)

## Logs

Append-only JSON lines:

```
.cursor/auto-ship/run.log
```

(gitignored)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Hooks not firing | Restart Cursor; verify Hooks settings tab |
| Push fails | Ensure git credentials / SSH agent; check log |
| Lint blocks ship | Fix types; re-run agent or `pnpm run auto-ship` |
| Too many commits | Debounce is 10s; increase in `auto-ship-config.json` |
| Wrong repo root | Project hooks prefer hook-adjacent `.git`; user hooks need cwd at `vishvakarma-os-live` |

## Smoke test

1. Make a small tracked edit (e.g. comment in README)
2. Run any agent shell command that succeeds
3. Check `.cursor/auto-ship/run.log` for `committed` + `pushed`
4. Confirm remote has new commit

## Files

| Path | Role |
|------|------|
| `scripts/auto-ship/auto-ship.mjs` | Core engine (lint → commit → push) |
| `scripts/auto-ship/auto-ship-lib.mjs` | Shared helpers (paths, debounce, repo root) |
| `scripts/auto-ship/auto-ship-config.json` | Excludes, timeouts, skip patterns |
| `scripts/auto-ship/install-user-hooks.mjs` | User-global installer |
| `.cursor/hooks/*.mjs` | Project hook wrappers |
