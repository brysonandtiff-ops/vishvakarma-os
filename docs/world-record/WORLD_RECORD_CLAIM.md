# World Record Claim — Vishvakarma.OS

**Status:** Self-Verified Candidate (not an official Guinness World Records title)

**Generated:** See `latest-measurement.json` for commit SHA and timestamp.

## Claim Title

Most enforced pre-release compliance gates in a browser-native architectural floor plan editor.

## Metric Definition

Count of distinct, named release gates that must pass (or attach evidence for) before `pnpm run release:gates` exits `0`.

**Primary metric (world record):** Gates 1–12 in [`src/governance/gates/gate-manifest.json`](../../src/governance/gates/gate-manifest.json).

**Total release pipeline:** 13 gates (Gate 13 verifies world-record measurement artifact exists).

## Inclusion Rules

A gate counts when all of the following are true:

1. It is listed in the authoritative gate manifest.
2. It has a unique gate number and human-readable name.
3. It is enforced by [`scripts/verify-all.js`](../../scripts/verify-all.js) during `pnpm run release:gates`.
4. It blocks release clearance when failing (exit code `1`) or when manual evidence is missing (exit code `2`).

## Exclusion Rules

The following do **not** count toward the metric:

- External CI checks not mirrored in `verify-all.js`.
- Marketing checklists without programmatic enforcement.
- Duplicate gates that only appear in UI copy but not in `verify-all.js`.

## Scope

**Browser-native architectural floor plan editor** means a single-page application that:

- Runs in a web browser without a native install requirement.
- Supports 2D floor plan editing (walls, openings, measurements).
- Ships as Vishvakarma.OS from this repository.

## Current Measurement

Run locally:

```bash
pnpm run record:measure
```

Outputs:

- `docs/world-record/latest-measurement.json`
- `public/world-record/latest-measurement.json`

## Honesty Statement

This claim is **self-verified** from repository artifacts. It is **not** an official Guinness World Records title until GWR adjudication completes and a certificate is attached at `public/records/gwr-certificate.pdf`.

Gate count alone does not imply product quality, production readiness, or market leadership.

## Related Documents

- [`COMPETITOR_BASELINE.md`](COMPETITOR_BASELINE.md)
- [`EVIDENCE_BUNDLE.md`](EVIDENCE_BUNDLE.md)
- [`WITNESS_ATTESTATION.md`](WITNESS_ATTESTATION.md)
- [`GUINNESS_APPLICATION.md`](GUINNESS_APPLICATION.md)
