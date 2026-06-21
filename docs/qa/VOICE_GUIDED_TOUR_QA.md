# Voice Guided Tour QA

Purpose: verify the full software voice tour works on desktop, iPad Safari, and installed iPad PWA without shipping fake MP3 files.

## Expected behavior

- A floating **Voice tour** control is visible.
- Opening the panel shows the whole-software chapter list.
- Browser voice mode speaks each chapter using built-in speech synthesis when supported.
- MP3 mode attempts the expected file path and falls back to browser voice when the file is missing.
- Chapter selection navigates to the correct route.
- Overlay steps open the relevant existing tutorial track.
- Reduced-motion users are not forced into extra animation.

## Acceptance checks

| Check | Expected result | Result |
|---|---|---|
| Launch control visible | Voice tour button appears above existing floating controls | TBD |
| Browser voice plays | Play reads the current chapter aloud | TBD |
| Pause/resume works | Audio pauses and resumes without route crash | TBD |
| Stop works | Audio stops and state resets | TBD |
| Next/back works | Chapter changes and route updates when needed | TBD |
| MP3 fallback works | Missing MP3 falls back to browser voice with status message | TBD |
| Overlay steps works | Existing tutorial overlay opens for the chapter track | TBD |
| iPad PWA works | Installed PWA shows the control after auto-update | TBD |
| No auth drift | Auth copy and Google SSO contract remain unchanged | TBD |

## Evidence to capture

1. Desktop `/editor`: voice panel open with Editor chapter.
2. iPad `/editor`: play browser voice, then switch chapters.
3. iPad PWA after Vercel deploy: confirm voice button appears after refresh.
4. MP3 mode: confirm missing file fallback message appears until audio files are added.
