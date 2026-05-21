# Vishvakarma.OS Brand Lock

This document locks the current visual direction for Vishvakarma.OS.

## Canonical logo

The official logo is the uploaded swan/V Vishvakarma mark.

Current repo asset:

- `public/brand/vishvakarma-official-logo.svg`

Use this asset for:

- favicon / browser icon
- splash / loading screens
- auth page
- app shell brand rail
- presentation/deck references

Do not replace it with generic icons such as shield, layer, blueprint, or cube icons.

## Visual direction

The UI must align with the supplied reference images:

1. iPad-first architectural blueprint workflow.
2. Cream drafting-board background.
3. Black tool rails and slim professional controls.
4. Gold accent lines for active/selected architectural elements.
5. Black/gold Vishvakarma splash/auth stage.
6. Sacred-architecture logo treatment, but functional drafting UI after login.

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

- Keep the auth page black/gold and centered around the official logo.
- Keep the editor workspace cream/blueprint-like, not generic SaaS blue.
- Keep tool rails compact and iPad-friendly.
- Keep route/auth/security evidence separate from visual changes.
- Do not add unrelated features during brand passes.

## Current implementation files

- `public/brand/vishvakarma-official-logo.svg`
- `src/vish-theme.css`
- `src/main.tsx`
- `src/pages/AuthPage.tsx`
- `src/components/layouts/AppLayout.tsx`
- `src/components/common/RouteGuard.tsx`
- `index.html`
