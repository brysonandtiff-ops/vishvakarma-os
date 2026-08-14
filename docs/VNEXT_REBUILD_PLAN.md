# Vishvakarma.OS vNext Rebuild

Status: Work in progress

## Objective
Rebuild Vishvakarma.OS on a clean Cloudflare-native production foundation while preserving proven product capabilities and data contracts.

## Preserve
- Core product identity and UX direction
- 2D floor-plan editor behavior
- Live 2D ↔ 3D project manifest model
- Export workflows
- Supabase Auth, Postgres/RLS, and Storage data contracts
- Proven compliance, optimization, governance, and project workflows
- Existing regression knowledge and useful tests

## Rebuild cleanly
- Fresh React + TypeScript + Vite application shell
- Cloudflare as the only production web/API runtime
- Supabase as the only auth/database/storage backend
- Cloudflare-native Stripe and AI server endpoints
- Minimal environment contract with no Vercel production assumptions
- Smaller, deterministic release pipeline
- iPad-first responsive design system and accessibility baseline

## Cutover law
The existing production deployment remains available only as a Work in Progress reference while vNext is built. It must not be removed until vNext has passed feature-parity, auth, RLS, export, browser, accessibility, performance, security, and production smoke gates.

## Tomorrow build sequence
1. Export a clean source ZIP/reference snapshot from the current proven repository state.
2. Create the fresh vNext workspace without copying legacy deployment configuration.
3. Establish the design system, routing, auth shell, Supabase client/server boundaries, and Cloudflare deployment contract.
4. Port features by contract, not by copying the entire legacy repo.
5. Run proof gates after each feature group.
6. Deploy vNext to a separate Cloudflare preview/staging target.
7. Compare legacy and vNext feature parity.
8. Cut over only after all release gates pass.
