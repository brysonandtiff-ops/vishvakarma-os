# Post-hardening page reference refresh note

The existing page-reference screenshots were captured before the 2026-07 Google SSO-only, mobile/iPad fullscreen, desktop polish, editor/3D polish, iOS/FPS hardening, VIP landing layout, and Lite Editor recovery-route passes.

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
- `/` shows the VIP-inspired landing structure: status pill, product window frame, governance strip, and product rooms.
- `/editor` evidence covers full studio canvas, tool rail, sample loading, export dialog, and 3D preview or WebGL fallback.
- `/editor-lite` evidence covers the recovery editor: 2D canvas, 3D pane, Select, Wall, Door, Window, Pan, Delete, and Export JSON.
- `/features` clearly distinguishes Available vs Preview modules.
- `/pricing` cards and badges do not clip on iPhone, iPad, or desktop.
- `/optimization` renders an empty/design-battle state instead of hanging on loading.
- Governance create actions show truthful local/cloud availability.
- `/world-records` preserves candidate/self-verified wording.
- No screenshot should show horizontal overflow, clipped primary actions, or fake/placeholder claims.
