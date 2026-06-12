# Vishvakarma.OS — iPad Production Readiness Evidence

Status: private-beta production readiness hardening
Date: 2026-05-23

## Release gate status

| Gate | Required command | Expected result |
|---|---|---|
| Lint/type/dependency/structure gate | `pnpm run lint` | Pass |
| Unit and integration tests | `pnpm run test` | 19 files / 386 tests passing or better |
| Production route gate | `pnpm run test:routes` | 4 / 4 route contract tests passing |
| Production build | `pnpm run build` | `dist/` generated successfully |
| Auth E2E | `pnpm run test:e2e` | private routes redirect signed-out users to `/auth` |
| iPad/PWA E2E | `pnpm run test:e2e` | manifest, Apple metadata, and iPad portrait/landscape auth views pass |

## iPad Home Screen readiness

Implemented:

- `public/manifest.webmanifest`
- App icons and Apple touch icons are embedded as WebP base64 directly from the official swan logo artwork.
- `<link rel="manifest">` in `index.html`
- `<link rel="apple-touch-icon">` in `index.html`
- `apple-mobile-web-app-capable=yes`
- `apple-mobile-web-app-status-bar-style=black-translucent`
- `apple-mobile-web-app-title=Vishvakarma.OS`
- `viewport-fit=cover` viewport support
- `interactive-widget=resizes-content` for Safari keyboard resize
- Lightweight service worker via `vite-plugin-pwa` (shell/static precache, auto-update)

Manual iPad Safari proof still required before public release:

1. Deploy production preview.
2. Open the deployed site in Safari on a physical iPad.
3. Choose Share → Add to Home Screen.
4. Confirm app name is `Vishvakarma.OS`.
5. Launch from Home Screen.
6. Confirm it opens in standalone mode.
7. Confirm `/auth` renders correctly in portrait and landscape (safe-area + keyboard).
8. Confirm private routes redirect to `/auth` while signed out.
9. Confirm service worker registers (offline shell only — auth/API remain online).
10. Capture screenshots or video for release evidence.

### Physical Device Evidence Log
*(Automated Playwright captures in `docs/release/evidence/`; Home Screen install still requires a physical iPad.)*
- [ ] **Home Screen icon installed:** (e.g., `ipad_homescreen.png`) — manual Safari Share → Add to Home Screen
- [x] **Auth page (Portrait):** `ipad-auth-portrait.png`
- [x] **Auth page (Landscape):** `ipad-auth-landscape.png`
- [x] **Editor workspace:** `ipad-editor-landscape.png`
- [x] **3D Toggle/Panel opened:** `ipad-3d-panel.png`
- [ ] **Autosave/Sync badge visible:** verify on device after cloud env is configured

## Bundle readiness

Production bundle splitting is configured in `vite.config.ts`:

- `vendor-react`
- `vendor-ui`
- `vendor-3d`
- `vendor-supabase`
- `vendor-misc`

The goal is to reduce the single large bundle warning and make future iPad performance tuning easier.

## Accessibility warning fix

The keyboard shortcuts dialog now includes `DialogDescription`, satisfying Radix dialog accessibility expectations and reducing noisy test stderr output.

## Stop-ship conditions

Do not mark Vishvakarma.OS public-production-ready until all of the following are true:

- `pnpm run lint` passes.
- `pnpm run test` passes.
- `pnpm run test:routes` passes.
- `pnpm run build` passes.
- `pnpm run test:e2e` passes.
- Physical iPad Add to Home Screen proof is captured.
- Bundle output is reviewed after vendor splitting.
- No unexpected private route is reachable while signed out.

## Rollback notes

If PWA metadata causes deployment or icon issues, rollback these files first:

- `public/manifest.webmanifest`
- The inline base64 `href` parameters for icons.
- iPad metadata links in `index.html`

If E2E becomes unstable due to local port conflicts, verify port `4173` is not already occupied before rerunning Playwright.
