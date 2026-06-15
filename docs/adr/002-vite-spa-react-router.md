# ADR-002: Vite SPA + React Router (not Next.js)

**Status:** Accepted  
**Date:** 2026-02-15  

## Context

The product requires an iPad-first, browser-native workstation with heavy client-side 3D (Three.js/R3F), offline-capable PWA behavior, and minimal server-side rendering needs. Framework choice affects bundle size, deploy model, and API route placement.

## Decision

Use **Vite + React 18 SPA** with **React Router 7** for client-side routing. Server logic runs as **Vercel serverless functions** in `api/`, not as Next.js API routes or SSR pages.

## Consequences

- Positive: Fast HMR, rolldown-vite build, static `dist/` deploy on Vercel
- Positive: Clear separation between SPA and serverless billing/AI
- Negative: No built-in SSR/SEO for app routes (marketing pages are client-rendered)
- Neutral: Documentation must explicitly state "not Next.js" for due diligence reviewers

## References

- [handoff/03-architecture-and-data-flow.md](../handoff/03-architecture-and-data-flow.md)
- [developer/ARCHITECTURE.md](../developer/ARCHITECTURE.md)
