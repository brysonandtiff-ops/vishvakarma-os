# Competitor Baseline Survey

**Survey date:** 2026-05-30  
**Surveyor:** Vishvakarma.OS repo completion pass  
**Purpose:** Honest point-in-time comparison for the world record gate-count claim.

## Method

For each product we checked public marketing pages, product documentation, and repository/source availability (where open) for **built-in, in-product pre-release compliance gates** comparable to Vishvakarma.OS Gate 1–12 (spec lock, registry, route manifest, sample validation, security headers, env template, tests, E2E, save/load evidence, 2D/3D parity, touch audit, performance evidence).

We did **not** count generic cloud CI (GitHub Actions, etc.) unless the product ships an in-app release gate dashboard tied to those checks.

## Results

| Product | Browser floor-plan editor | In-app governance / release gates | Gate count (comparable) | Source checked | Notes |
|---|---|---:|---:|---|---|
| **Vishvakarma.OS** | Yes | Yes | **12** | `src/governance/gates/gate-manifest.json`, `scripts/verify-all.js` | Spec Center, Registry, Change Requests, Releases, Audit, World Records |
| Floorplanner | Yes | No | 0 | https://floorplanner.com | SaaS editor; no public in-repo release gate pipeline |
| RoomSketcher | Yes | No | 0 | https://www.roomsketcher.com | Consumer/pro tool; no documented in-app release gates |
| Homestyler | Yes | No | 0 | https://www.homestyler.com | Web editor; no governance OS surfaced |
| Planner 5D | Yes | No | 0 | https://planner5d.com | Web/native; no comparable gate manifest found |
| SketchUp Free (web) | Partial | No | 0 | https://www.sketchup.com | 3D-first; not a comparable 2D floor-plan governance pipeline |

## Limitations

- This survey is **point-in-time** and based on publicly visible product behavior and documentation.
- Competitors may use internal release processes not visible externally — we do not claim exhaustive private knowledge.
- Vishvakarma.OS compares **in-repo enforced gates**, not overall software quality or feature count.
- A gate count of 12 does not automatically confer a Guinness World Records title.

## Conclusion

As of the survey date, Vishvakarma.OS documents **12 enforced pre-release compliance gates** in a browser-native architectural floor plan editor. Surveyed mainstream competitors show **0 comparable in-product gates** in public documentation.

**Recommended next step:** Independent witness attestation ([`WITNESS_ATTESTATION.md`](WITNESS_ATTESTATION.md)) and Guinness category proposal ([`GUINNESS_APPLICATION.md`](GUINNESS_APPLICATION.md)).
