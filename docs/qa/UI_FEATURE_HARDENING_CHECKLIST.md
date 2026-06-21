# UI + Feature Hardening Checklist

Purpose: keep Vishvakarma.OS usable for non-technical testers across the full product after every UI upgrade.

## Core user surfaces

| Surface | Must be checked | Result |
|---|---|---|
| Auth | Login card visible, official logo present, Google SSO reachable, magic link reachable | TBD |
| Marketing | Home/features/pricing CTAs route correctly | TBD |
| Projects | Existing projects and demo project cards open correctly | TBD |
| Editor | Demo, grid, tools, 3D, save/open/import/export are reachable | TBD |
| Tool rail | Base and power tools are visible on iPad and desktop | TBD |
| Canvas | Grid visible, pan/zoom/select/wall/door/window/text tools usable | TBD |
| 3D Room | Premium samples load, stats/header visible, back to editor works | TBD |
| Optimization | Page opens without route crash and primary CTA is visible | TBD |
| Governance | Spec center, registry, change requests, releases, audit log route correctly | TBD |
| PWA | Installed iPad app refreshes after new Vercel deploy | TBD |

## iPad-first rules

- Critical actions must not live only in hidden overflow menus.
- Any action needed by a first-time tester needs a readable label, not just an icon.
- Toolbars may scroll, but the first visible controls must include the safest next actions.
- Buttons must be at least 44px high on touch devices.
- Dialogs and menus must remain within viewport safe areas.

## Evidence required before calling a build user-ready

1. iPad landscape recording of auth → editor → demo load → grid toggle → 3D toggle.
2. iPad portrait screenshot of auth and editor toolbar.
3. Desktop screenshot of editor toolbar and sample picker.
4. PWA installed-app refresh check after a Vercel deployment.
