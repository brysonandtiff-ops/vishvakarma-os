# RFC 009 — Compliance Jurisdiction v1

## Status

**Accepted (v1 foundation)** — AU NCC Vol 2 H-class rule pack with cited findings; certified library integration deferred.

## Problem

Compliance rules exist as stubs (`src/rules/ncc/*`) without structured **rule packs**, clause citations, or jurisdiction packaging suitable for architect-facing audit exports.

## Proposal

1. **Rule pack registry** — `src/modules/compliance/rulePacks/` per jurisdiction
2. **Cited findings** — each finding may attach `citation: { code, clause, summary }`
3. **Disclaimers preserved** — all exports retain decision-support prototype language
4. **India NBC** — parallel pack structure (existing NBC rules); citations in Horizon 1

## Rule pack: AU NCC Vol 2 H-class (v1)

Maps existing rule IDs to NCC 2022 reference strings (decision-support, not certified):

| Rule ID | Citation summary |
|---------|------------------|
| `ncc-bedroom-size` | Habitable room minimum dimensions |
| `ncc-bedroom-egress` | Emergency egress openings |
| `ncc-habitable-height` | Ceiling height minimums |

Shared rules (access, energy, zoning, fire) retain category labels; citations added incrementally.

## Success criteria

- Gate 14 when wired
- Vitest: pack entries match registry rule IDs for `au` jurisdiction
- Compliance panel shows citation on findings (UI follow-up)

## Non-goals

- Certified NCC digital library API
- Council DA auto-submission
- Auto-repair of violations

## References

- [RFC 005 — Building Codes](005-building-codes.md)
- `src/modules/compliance/rulePacks/`
- `src/rules/registry.ts`
