# RFC 005 — Building Codes & Compliance Engine

## Status

Phase 2 implemented — Australian NCC-oriented stubs with full export gate.

## Overview

The compliance engine runs pluggable rules against every project manifest and produces a live audit report with category rollups:

- **NCC** — bedroom size, egress, habitable room height
- **Access** — door width, circulation width
- **Energy** — thermal comfort, glazing ratio
- **Zoning** — setbacks, site coverage
- **Fire** — egress path, smoke alarm zones

## Rule packs

| Rule ID | Category | Threshold (stub) | FAIL | WARNING |
|---------|----------|------------------|------|---------|
| `ncc-bedroom-size` | NCC | 6.5 m² area, 2.4 m width | Below minimum | No bedrooms labelled |
| `ncc-bedroom-egress` | NCC | Door or window on room walls | No openings | Window only |
| `ncc-habitable-height` | NCC | 2.4 m wall height | Below minimum | — |
| `access-door-width` | Access | 0.85 m clear width | Narrow doors | — |
| `access-circulation` | Access | 1.0 m hallway | — | Unlabelled circulation |
| `energy-thermal` | Energy | Comfort score | &lt; 40 | &lt; 55 |
| `energy-glazing` | Energy | 8–40% glazing ratio | — | Out of range |
| `zoning-setback` | Zoning | Footprint inside parcel | Violation | No site plan |
| `zoning-coverage` | Zoning | Max 40% coverage | Over limit | No site plan |
| `fire-egress-path` | Fire | Path to exterior door | — | No path found |
| `fire-smoke-zone` | Fire | Per-bedroom zone | — | Unlabelled bedrooms |

Constants live in `src/modules/compliance/constants.ts` (`NCC_AU_THRESHOLDS`).

## Aggregation

- Category status: worst finding in category (`fail` > `warning` > `pass`)
- Overall: worst across categories
- `blocked = overall === 'fail'`

## Integration points

- `runComplianceAudit(project)` — `src/modules/compliance/complianceModule.ts`
- `CompliancePanel` — live sidebar audit
- `ComplianceBanner` — sticky FAIL banner in editor
- `enforce(manifest).checks.buildingCompliance` — export gate
- `ExportModule.exportJSON` — blocked when enforcement fails

## Fixtures

- `public/samples/compliance-setback-fail.json` — E2E setback violation
- Vitest: `src/rules/ncc/*.test.ts`, `src/rules/zoning/setbackRule.test.ts`

## Out of scope

Certified NCC library integration, council API lookup, multi-storey fire simulation, auto-repair of violations.
