# iPad Touch Audit HUD QA

Purpose: verify the tester-only iPad audit overlay can find live tap-target and layout issues without affecting normal users.

## Expected behavior

- The HUD is opened from the command palette item **iPad Touch Audit HUD**.
- Opening the HUD scans the current viewport.
- The HUD highlights detected issues on screen.
- It reports:
  - small touch targets under 44 x 44 px
  - partially offscreen interactive controls
  - blocked center taps
  - clipped overflow traps
- The HUD can rescan the viewport and copy a Markdown report.
- The HUD is closed by the user and is not visible by default.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Open HUD | Command palette opens the HUD | TBD |
| Scan viewport | HUD scans and shows summary counts | TBD |
| Highlight issues | Red/yellow outlines appear over detected elements | TBD |
| Copy report | Copies a Markdown report or shows fallback toast | TBD |
| Close HUD | HUD closes cleanly | TBD |
| Tester-only | No visible launcher appears for normal users | TBD |
| No drift | Auth, Supabase, routes, and PWA lifecycle remain unchanged | TBD |

## Manual evidence to capture later

1. iPad landscape screenshot with HUD open on `/editor`.
2. iPad portrait screenshot after rescanning.
3. Copied report pasted into QA notes.
4. Close HUD and confirm normal UI is untouched.
