# S.I.R.E. Vishvakarma.OS — Voice Polishing Acceptance

Source change date: 19 November 2026. Scope: existing private PR #210, not main / production.

## Observed problems repaired in source
- Safari can discover voices after a chapter begins. Do not restart active speech when getVoices() refreshes.
- StrictMode must not double-write preference settings or dispatch duplicate preference-change events.
- Cancel a queued voice-tour chapter when the user closes or stops the tour. No ghost speech after leaving.
- Detach HTMLAudioElement events before cancelling playback so an MP3 failure never starts a stopped chapter.
- If browser narration fails, the welcome cinematic continues with captions and explains the limitation.
- Sample voice is unavailable while the film is playing (otherwise scene-cleanup could instantly silence the sample).
- Default is normal device-native pitch, not artificial low pitch; Australian English preferred if an appropriate voice exists.
- No text or recordings are sent to paid services from this feature.

## Live device checks needed
1. Sign in on an actually authorised iPad account, open the first-login film, and tap Play with voice enabled.
2. Tap Next/Back and Skip; confirm audio does not continue after closing.
3. On Safari and installed PWA, change narrator and speaking pace, reload, and check preferences survive where storage permits.
4. Open Voice Tour from both home and 3D UI, start chapter, tap Next, and close immediately; no delayed audio.
5. With sound muted or no voice installed, confirm captions and voice error status remain usable.
6. Capture a real-device screen recording with audio and source SHA; get owner approval of accent, pronunciation, and pacing.

## Release truth
Passing compile/unit tests cannot prove that the chosen iPad voice sounds professional; only a real audio capture and listener sign-off can. The old MP4 is instrumental/captioned, not secretly re-narrated. Preserve the approved logo and original artwork. Do not merge while #153, #188 and authenticated account/save proofs remain blocked.
