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
- `afterFileEdit` (Biome + auto-ship)
- `stop`

## Pipeline

1. Recursion guard (skip `git`, `auto-ship`, `lint:types` commands)
2. Debounce lock (10s) — batches rapid edits
3. `git status --porcelain` — exit if clean
4. Exclude secrets/artifacts (`.env*`, exports, caches)
5. **`pnpm run lint:types`** — **blocks commit on failure**
6. `git add` safe paths → `git commit` → `git push origin HEAD`

## Manual commands

```bash
pnpm run auto-ship          # run pipeline now
pnpm run auto-ship:dry       # log what would ship, no commit
```

## Disable

```bash
set VISH_AUTO_SHIP=0        # Windows CMD
$env:VISH_AUTO_SHIP="0"     # PowerShell
export VISH_AUTO_SHIP=0     # macOS/Linux
```

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
| Wrong repo root | Open Cursor at `vishvakarma-os-live` or ensure `.git` is discoverable |

## Smoke test

1. Make a small tracked edit (e.g. comment in README)
2. Run any agent shell command that succeeds
3. Check `.cursor/auto-ship/run.log` for `committed` + `pushed`
4. Confirm remote has new commit

## Files

| Path | Role |
|------|------|
| `scripts/auto-ship/auto-ship.mjs` | Core engine |
| `scripts/auto-ship/auto-ship-config.json` | Excludes, timeouts |
| `scripts/auto-ship/install-user-hooks.mjs` | User-global installer |
| `.cursor/hooks/*.mjs` | Hook wrappers |
