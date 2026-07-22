# 👑 Release Champion — VISHVAKARMA.OS

One command. Full production-readiness workflow. Auditable evidence pack.

Stdlib-only Python (3.9+). No pip installs. No node deps.

## Install (2 minutes)

1. Copy into your repo root:

```
scripts/release_champion.py
champion.config.json
```

2. Add to `package.json` → `scripts`:

```json
"release:champion": "python3 scripts/release_champion.py",
"release:champion:tag": "python3 scripts/release_champion.py --tag --draft-release"
```

3. Map stage scripts. Open `champion.config.json` and point each stage's
   `"script"` at your real pnpm script names (e.g. if your typecheck script
   is `types` not `typecheck`, change it). **Stages whose script doesn't
   exist in package.json are auto-skipped** — nothing breaks if an audit
   isn't wired up yet.

## Run

```bash
pnpm run release:champion              # full pipeline
pnpm run release:champion:tag          # + git tag + GitHub Release draft (needs gh CLI)
python3 scripts/release_champion.py --skip lighthouse
python3 scripts/release_champion.py --only tests build
```

Exit code: `0` on Champion build, `1` if any gate fails — CI-safe.

## What each run produces

`docs/release/evidence/<run-id>/`

| File | What it is |
|---|---|
| `report.json` | Machine-readable full report |
| `dashboard.html` | Dark-mode HTML dashboard with score bar + screenshot gallery |
| `certificate.pdf` | PDF release certificate (dependency-free generator) |
| `world-record.md` | World-record eligibility report (verifiable metrics + fingerprint) |
| `deploy-checklist.md` | Deployment checklist incl. iPad Safari smoke test |
| `release-notes.md` | Git log since last tag |
| `BUILD_FINGERPRINT.txt` | SHA-256 fingerprint of the entire `dist/` tree |
| `logs/*.log` | Raw stdout/stderr per stage |
| `screenshots/` | Copies of anything matching `screenshotsGlob` |

## Scoring

- Only **required** stages gate the score (skipped stages don't count against you).
- Any FAIL — required or not — blocks Champion status.
- `requiredScorePct` in the config sets the pass threshold (default 100).

## Screenshots

The pipeline doesn't drive a browser itself. Drop PNGs into
`docs/release/screenshots/` (e.g. from your Playwright run) and they're
copied into the evidence pack and rendered in the HTML gallery automatically.
To automate: add a `screenshots` pnpm script and register it as a stage in
the config.

## Notes

- Fingerprint is deterministic: same commit + same build ⇒ same SHA-256.
- `--tag` creates `champion-<run-id>` annotated tags; push with `git push --tags`.
- `--draft-release` requires the GitHub CLI (`gh auth login` once).
- Works on macOS/Linux out of the box; on Windows use `python` instead of `python3`.
