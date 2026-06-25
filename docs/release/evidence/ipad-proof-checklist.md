# iPad 10 Release Proof Checklist

Use this checklist during a real-device iPad proof pass.

## Setup

- [ ] Device is an iPad 10 or equivalent iPadOS Safari device.
- [ ] Recording is enabled.
- [ ] Device has normal network connection.
- [ ] Tester knows the build/commit being tested.

## Auth

- [ ] Open `https://vishvakarma-os.app/auth`.
- [ ] Auth page renders correctly.
- [ ] No `Backend not configured` text.
- [ ] No `Service configuration required` text.
- [ ] Google SSO button is reachable.
- [ ] Google SSO begins account chooser or valid auth redirect.

## Editor landscape

- [ ] Open `/editor` in landscape.
- [ ] Editor top bar is visible.
- [ ] Tool rail is visible and reachable.
- [ ] Select tool responds.
- [ ] Wall tool responds.
- [ ] Door tool responds.
- [ ] Window tool responds.
- [ ] Dimension tool responds.
- [ ] Furniture tool responds.
- [ ] Terrain tool responds.
- [ ] Grid toggle responds.
- [ ] QA launcher is reachable.
- [ ] QA scan runs.

## Project demo load

- [ ] Open `/projects`.
- [ ] Demo project card/button is visible.
- [ ] Demo project opens into `/editor`.
- [ ] Editor top bar remains visible after load.
- [ ] Tool rail remains visible after load.

## Portrait rotation

- [ ] Rotate to portrait.
- [ ] Primary navigation remains reachable.
- [ ] Tool rail or menu access remains reachable.
- [ ] No destructive horizontal overflow blocks controls.
- [ ] QA launcher remains reachable.

## Final sign-off

- [ ] Screen recording or screenshots captured.
- [ ] Evidence link added to release notes.
- [ ] Result recorded as PASS or FAIL.
- [ ] Any issues opened as GitHub issues or follow-up PRs.
