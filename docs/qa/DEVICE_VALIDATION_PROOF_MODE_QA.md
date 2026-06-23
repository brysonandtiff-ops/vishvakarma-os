# Device Validation Proof Mode QA

## Purpose

Device Validation Proof Mode gives Vishvakarma.OS a repeatable user-facing checklist for device hardening evidence after iPad 10 and mobile responsiveness work.

## How to open

Use the floating `QA` button in the lower-right safe area.

## Manual checks

- iPad 10 landscape
- iPad 10 portrait
- Mobile portrait
- Desktop
- Auth page
- Editor open
- Grid/demo/voice tour
- Safe-area + 44px touch targets

## Automatic scan

Use `Run scan` to capture:

- layout viewport
- visual viewport
- body overscroll behavior
- interactive control count
- potential controls under 44px
- potential offscreen interactive controls

## Proof export

Use `Copy proof` to copy a Markdown report containing:

- timestamp
- current path
- viewport
- user agent
- pass/fail/pending summary
- manual checklist
- automatic scan output

## Guardrails

- Local-only state via localStorage.
- No Supabase changes.
- No auth changes.
- No route changes required.
- No project data mutations.
