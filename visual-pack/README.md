# 📸 Visual Hardening Pack Builder v2 — VISHVAKARMA.OS

**v2 exists because v1 banked 23 screenshots that were all 404s, auth walls, and
splash screens — and reported them as green.** v2 validates every capture and
refuses to build a pack from invalid evidence.

## The order that works

```powershell
# 0. Serve the app (separate window, leave running)
pnpm run build
pnpm run preview

# 1. Find your REAL routes — crawls src/ for route paths, probes each one live
python visual-pack\scripts\build_visual_pack.py --discover
#    → writes discovered-routes.json; shows OK / 404 / AUTH WALL / SPLASH per route
#    → put the OK + AUTH WALL ones into pack.config.json "shots"

# 2. Log in — now VERIFIES the session before saving
python visual-pack\scripts\build_visual_pack.py --login

# 3. Confirm the session survives a fresh browser context
python visual-pack\scripts\build_visual_pack.py --verify-auth

# 4. Capture
python visual-pack\scripts\build_visual_pack.py
```

## What validation catches

Every capture must prove it rendered the intended route:

| Check | Rejects |
|---|---|
| Final URL | silent redirects (auth bounce to `/auth`) |
| 404 markers | "404", "workspace manifest", "मार्ग न लभते" |
| Auth wall markers | "Continue with Google SSO", "Request access" |
| Sparse body | splash screens captured before boot |
| `expectText` / `expectSelector` | route rendered but wrong content |

Invalid captures go to `pack/_rejected/` (never into the zip), are listed in the
manifest as **FINDINGS**, and the build exits 1. `--allow-invalid` overrides.

## Per-shot config options

```json
{ "id":"login", "path":"/auth",
  "expectKind":"AUTH WALL",              // this shot IS the auth page — don't reject it
  "expectText":"Architect",              // must appear in body text
  "expectSelector":"[data-testid='x']",  // must exist in DOM
  "allowRedirect": true,                 // permit landing elsewhere
  "allowSparse": true,                   // permit near-empty body (splash by design)
  "settleMs": 4000 }                     // wait longer (3D routes)
```
Top-level: `"authProbePath"` — an authenticated-only route used by `--login` and
`--verify-auth` to confirm the session actually works. Set this to a real
interior route. `"minBodyChars"` tunes the sparse threshold (default 120).

## Auth that won't persist

If `--login` reports 0 cookies/storage entries, or `--verify-auth` fails, your
session isn't in a place `storage_state` can capture. Options:

1. **Check where the token lives** — DevTools → Application → Local Storage.
   Supabase uses `sb-<project>-auth-token`. If it's there, storage_state should
   work; if the app keeps it in memory only, it can't.
2. **Increase the settle** before pressing Enter — some apps write the token
   after a redirect completes.
3. **Fallback: seed the token directly.** Add to config:
   `"authInject": {"key":"sb-xxx-auth-token","value":"<paste token>"}` and
   inject via `context.add_init_script` — ask for this if needed.
4. **Last resort**: capture the interior routes with `--allow-invalid` while
   logged in via a headed run, and hand-verify each PNG before packing.

## Notes
- `.auth-state.json` holds your session — add it to `.gitignore`.
- Screenshot SHA-256s in the manifest make packs diffable across builds (this is
  also your visual-regression seed for CI).
- Windows: use `python`, and `;` not `&&` between commands in PowerShell 5.1.
