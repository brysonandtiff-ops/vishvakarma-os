# Post-hardening page reference refresh note

The existing page-reference screenshots were captured before the 2026-07 Google SSO-only, mobile/iPad fullscreen, desktop polish, editor/3D polish, and iOS/FPS hardening passes.

Regenerate the full reference pack after this branch lands:

```bash
pnpm run capture:page-references
```

Also run the release screenshot pack:

```bash
pnpm run test:screenshots
```

Required truth checks for the refreshed screenshots:

- `/auth` shows Google SSO only: no email field, password field, magic-link flow, Apple login, or local workspace login.
- `/features` clearly distinguishes Available vs Preview modules.
- `/pricing` cards and badges do not clip on iPhone, iPad, or desktop.
- `/optimization` renders an empty/design-battle state instead of hanging on loading.
- Governance create actions show truthful local/cloud availability.
- `/world-records` preserves candidate/self-verified wording.
- Editor evidence covers canvas, tool rail, sample loading, export dialog, and 3D preview or WebGL fallback.
- No screenshot should show horizontal overflow, clipped primary actions, or fake/placeholder claims.
