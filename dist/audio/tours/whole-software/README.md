# Whole Software Tour MP3 Drop Zone

This folder is intentionally MP3-ready but does not ship fake generated audio.

The app currently uses browser speech synthesis by default. If real voice files are added later, place them here with these exact names:

1. `01-welcome.mp3`
2. `02-auth.mp3`
3. `03-projects.mp3`
4. `04-editor.mp3`
5. `05-3d-room.mp3`
6. `06-optimization.mp3`
7. `07-governance.mp3`
8. `08-profile.mp3`

## Recommended export settings

- Format: MP3
- Bitrate: 128–192 kbps
- Loudness target: about -16 LUFS
- Peak: under -1 dB
- Voice: calm, confident, helpful, not salesy
- Leave 250–400 ms of silence at the start and end of each file

## Free/no-key local generation option

A common local workflow is to use a free TTS command-line tool, export each chapter script from `docs/user/VOICE_TOUR_SCRIPTS.md`, then place the resulting files in this directory. Keep filenames exact so the in-app MP3 mode can find them.
