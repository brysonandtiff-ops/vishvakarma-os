# ADR-004: 13-gate release pipeline

**Status:** Accepted  
**Date:** 2026-05-01  

## Context

Vishvakarma.OS embeds a Governance OS with spec locking, change requests, and release evidence. Ad-hoc releases risk shipping unverified surfaces (auth, billing, iPad touch targets, world-record claims).

## Decision

Every production release must pass **13 strict gates** defined in `src/governance/gates/gate-manifest.json`, orchestrated by `pnpm run release:gates`. Gate 13 requires a machine-readable world-record measurement artifact.

Evidence artifacts live under `docs/release/evidence/`.

## Consequences

- Positive: Auditable release trail for investors and operators
- Positive: CI and local verify scripts align with gate manifest
- Negative: Release process is heavier than typical SaaS deploy-and-forget
- Neutral: Some gates may be waived with documented evidence (operator discretion)

## References

- [GOVERNANCE_QUICKSTART.md](../GOVERNANCE_QUICKSTART.md)
- [release/OPERATOR_CHECKLIST.md](../release/OPERATOR_CHECKLIST.md)
- [handoff/09-testing-quality-and-release.md](../handoff/09-testing-quality-and-release.md)
