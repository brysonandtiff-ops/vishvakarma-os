# Vishvakarma.OS Brand Lock

This document locks the current visual direction for Vishvakarma.OS.

## Canonical logo

The official logo is the uploaded swan/V Vishvakarma image supplied by the project owner.

Current repo implementation:

- `src/brand/officialLogo.ts`
- `OFFICIAL_LOGO_SRC`

This is a raster image data asset derived from the user-provided PNG artwork. It replaced the earlier generated SVG-style approximation.

Use this asset for:

- splash / loading screens
- auth page
- app shell brand rail
- editor header
- onboarding panels
- presentation/deck references

Favicon and PWA install icons are **derived** from the official logo (inline WebP artwork), not separate artwork:

- Run `pnpm run assets:pwa-icons` after changing `public/brand/vishvakarma-official-logo.svg`
- Outputs: `public/icons/icon.svg`, `public/icons/apple-touch-icon.svg`, `public/brand/vishvakarma-apple-touch-icon.png`

Do not replace the official logo with:

- generated SVG approximations
- generic icons such as shield, layer, blueprint, or cube icons
- AI-recreated logo variants
- alternate swan/V marks

## Visual direction

The UI must align with the supplied reference images:

1. iPad-first architectural blueprint workflow.
2. Cream drafting-board background.
3. Black tool rails and slim professional controls.
4. Gold accent lines for active/selected architectural elements.
5. Black/gold Vishvakarma splash/auth stage.
6. Official swan/V logo treatment, but functional drafting UI after login.

## Product tone

- Premium architectural studio
- iPad-first drawing workflow
- Professional blueprint editor
- Live 3D floor planner
- Governance-backed production software

## Color direction

| Token | Use |
|---|---|
| Ink black | Auth/splash, sidebar, tool rail |
| Cream paper | Canvas/workspace background |
| Warm gold | Logo, active states, selected objects, CTAs |
| Soft rose/gold | Logo secondary accents only |
| Muted charcoal | Text and tool surfaces |

## No-drift rules

- Keep the auth page black/gold and centered around the official user-provided logo.
- Keep the editor workspace cream/blueprint-like, not generic SaaS blue.
- Keep tool rails compact and iPad-friendly.
- Keep route/auth/security evidence separate from visual changes.
- Do not add unrelated features during brand passes.
- Do not reintroduce generated SVG logo files unless the user explicitly provides an SVG export of their real logo.

## Current implementation files

- `src/brand/officialLogo.ts`
- `src/styles/vish-tokens.css` — canonical brand tokens (`--vish-ink`, `--vish-cream`, `--vish-gold`, typography utilities)
- `src/vish-theme.css`
- `src/main.tsx`
- `src/components/ui/button.tsx` — use `variant="gold"`, `goldOutline`, `workstation` for brand CTAs
- `src/components/ui/input.tsx` — use `variant="workstation"` on auth/editor dark inputs
- `src/components/billing/BillingPlanCard.tsx` — shared pricing/profile plan cards
- `src/components/layouts/WorkspacePageShell.tsx` — document + governance page shells
- `src/components/common/WorkspacePageHeader.tsx` — unified page headers (includes `gov-page-header`)
- `src/lib/editorDialog.ts` — shared editor dialog chrome classes
- `src/pages/AuthPage.tsx`
- `src/pages/EditorPage.tsx`
- `src/components/layouts/AppLayout.tsx`
- `src/components/common/RouteGuard.tsx`
- `index.html`

## Deprecated CSS (migrate to Button/Input variants)

- `.vish-gold-cta`, `.vish-gold-button` → `Button variant="gold"`
- `.vish-gold-cta-outline` → `Button variant="goldOutline"`
- `.vish-mockup-input` → `Input variant="workstation"` or `.vish-input-workstation`
