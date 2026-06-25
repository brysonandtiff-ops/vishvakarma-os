# Vishvakarma.OS iPad 10 Real-Device Proof Pipeline

Date: 2026-06-25
Status: manual evidence gate created

## Purpose

This proof pack turns iPad testing into a repeatable release ritual. Automated viewport tests already confirm key controls are reachable at iPad 10 dimensions, but this document is for real Safari/iPadOS evidence.

## Required device

- Device: iPad 10 or equivalent iPadOS Safari device
- Orientation: landscape first, then portrait
- Network: normal Wi-Fi or hotspot
- Recording: iPad screen recording, exported to the evidence folder or linked in the release notes

## Evidence folder

Place screen recordings, screenshots, or compressed exports in:

```text
/docs/release/evidence/ipad-recordings/
```

Keep large binary files out of git if they exceed repository policy. When files are too large, store them externally and paste the evidence link into the release notes.

## Required proof flow

1. Open `https://vishvakarma-os.app/auth`.
2. Confirm the auth page loads without backend/config warnings.
3. Tap Google SSO and confirm the Google account chooser begins.
4. Return to the app with a valid account or use an already signed-in session.
5. Open `/editor`.
6. Confirm the editor top bar is visible.
7. Confirm the tool rail is reachable without hidden controls.
8. Tap at least these tools:
   - Select
   - Wall
   - Door
   - Window
   - Dimension
   - Furniture
   - Terrain
9. Toggle grid visibility.
10. Open a demo project from `/projects` and confirm it lands in `/editor`.
11. Open the QA launcher and run a scan.
12. Rotate to portrait and confirm primary controls remain reachable.
13. Confirm no horizontal overflow blocks core controls.
14. Confirm no fatal/backend/config text appears.

## Pass criteria

The iPad proof passes only when all of these are true:

- Auth loads.
- Google SSO starts.
- Editor opens.
- Tool rail is reachable.
- Core tool taps respond.
- Grid toggle responds.
- Demo project opens.
- QA launcher is reachable.
- No core controls are blocked by layout.
- No fatal/backend/config copy appears.

## Fail criteria

The iPad proof fails if any of these happen:

- The auth page cannot load.
- Google SSO cannot start.
- The editor cannot open.
- The tool rail is unreachable.
- Primary action buttons are hidden or blocked.
- The page has destructive horizontal overflow.
- The app shows `Backend not configured`, `Service configuration required`, or fatal app copy.

## Evidence summary template

```text
Date:
Device:
iPadOS version:
Browser:
Build/commit:
Tester:
Result: PASS / FAIL
Recording link:
Notes:
```

## Truth label

This is a manual evidence gate. It does not pass merely because desktop Playwright passed. It passes only when a real iPad or iPadOS Safari session is recorded or manually signed off.
