# NBC India Pre-check v1

**Status:** Implemented (decision-support stub)  
**Runtime source:** `src/rules/nbc/*`, `src/modules/compliance/constants.ts` (`NBC_IN_THRESHOLDS`)  
**Jurisdiction flag:** `ProjectManifest.jurisdiction === 'in'`

## Purpose

NBC India pre-check provides **exploratory residential compliance hints** aligned with common NBC India dwelling expectations. It runs when project jurisdiction is set to India, replacing NCC AU code rules while retaining shared accessibility, energy, zoning, and fire stubs.

## Disclaimer

This is **not** certified NBC compliance, municipal approval, or RERA clearance. Thresholds are simplified stubs for design exploration. Always verify with a licensed architect and local authority.

## Stub rules (v1)

| Rule ID | Check |
|---------|-------|
| `nbc-bedroom-size` | Min habitable area 7.0 m², min width 2.1 m |
| `nbc-habitable-height` | Min wall height 2.75 m |
| `nbc-stair-width` | Stair presence / symbolic width ≥ 0.9 m |

## Region pairing

India jurisdiction pairs with INR cost regions (`in-national`, `in-mumbai`, etc.) — see Construction Cost Intelligence spec.

## Tests

- `src/rules/nbc/*.ts` (via compliance module tests)
- Jurisdiction routing in `complianceModule.test.ts`
