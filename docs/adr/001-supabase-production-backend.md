# ADR-001: Supabase-only production backend

**Status:** Accepted  
**Date:** 2026-06-01  
**Supersedes:** Firebase/Firestore runtime selection (v1.2.x migration era)

## Context

Vishvakarma.OS originally supported Firebase Auth, Firestore, and Supabase in parallel during migration. Dual-backend complexity increased operational cost, test matrix size, and documentation drift.

## Decision

Production runtime uses **Supabase only** for:

- Authentication (email magic link, Google OAuth, Apple OAuth when configured)
- Postgres persistence with Row Level Security
- Storage (materials bucket)
- Billing entitlement state

Firebase artifacts remain for **legacy import/export and archive recovery** ([MIGRATION.md](../../MIGRATION.md)) but are not selectable at runtime.

## Consequences

- Positive: Single auth path, unified RLS, simpler operator docs
- Positive: Handoff appendices reflect one backend truth
- Negative: Firebase migration scripts must be maintained for portability evidence
- Neutral: CI may retain placeholder Firebase env vars for legacy compatibility tests

## References

- [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md)
- [handoff/06-security-and-compliance.md](../handoff/06-security-and-compliance.md)
