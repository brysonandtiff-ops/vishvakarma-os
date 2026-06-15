# Architecture Decision Records (ADR)

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  

Architecture Decision Records document significant technical decisions with context, status, and consequences.

Pre-implementation proposals remain in [rfc/](../rfc/README.md).

---

## Index

| ADR | Status | Title |
|-----|--------|-------|
| [001](./001-supabase-production-backend.md) | Accepted | Supabase-only production backend |
| [002](./002-vite-spa-react-router.md) | Accepted | Vite SPA + React Router (not Next.js) |
| [003](./003-project-manifest-source-of-truth.md) | Accepted | Project Manifest as editor state source |
| [004](./004-thirteen-gate-release-pipeline.md) | Accepted | 13-gate release pipeline |
| [005](./005-stripe-entitlement-model.md) | Accepted | Stripe entitlement model |

---

## Template (MADR-style)

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Superseded  
**Date:** YYYY-MM-DD  
**Deciders:** (team or role)

## Context

What is the issue?

## Decision

What was decided?

## Consequences

Positive, negative, and neutral outcomes.
```

---

## Lifecycle

- **Proposed** — under discussion (see RFCs)
- **Accepted** — current production decision
- **Superseded** — replaced by a newer ADR (link successor)

When superseding, update the old ADR status and add cross-links.
