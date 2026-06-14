# Vastu Harmony v1

**Status:** Implemented (decision-support)  
**Runtime source:** `src/core/simulations/vastu.ts`, `src/core/simulations/panchatattva.ts`  
**UI:** `VastuPanel`, `PanchatattvaPanel`, 8-sector canvas overlay (`vastuOverlay.ts`)

## Purpose

Vastu Harmony provides **exploratory layout guidance** for Indian residential planning. It scores room placement against eight directional sectors and five-element (Panchatattva) balance derived from room labels and plan geometry.

## Disclaimer

This module is **not** certified Vastu consultation, religious authority, or building approval. Outputs are heuristic decision-support for design exploration only. Do not represent harmony scores as guaranteed wellbeing, resale, or regulatory compliance.

## Inputs

| Input | Source |
|-------|--------|
| Wall geometry | `ProjectManifest.walls` |
| Openings (entrance) | `ProjectManifest.openings` |
| Room labels | `ProjectManifest.labels` |
| North bearing | `ProjectManifest.northOrientation` (degrees, 0 = plan north aligned screen-up) |

## Scoring rules (v1)

### Eight directions

- Plan centroid computed from wall endpoints.
- Each label mapped to a sector via `pointToVastuDirection()` with north rotation.
- Ideal placements (heuristic): Kitchen SE/NW, Master SW, Puja NE, Living N/NE/E, Bathroom W/NW.
- Sector scores aggregate room placement quality and entrance favorability (N, NE, E preferred).

### Panchatattva (five elements)

| Element | Sanskrit | Boosted by labels |
|---------|----------|-------------------|
| Agni | अग्नि | Kitchen, dining |
| Jala | जल | Bathroom, utility |
| Prithvi | पृथ्वी | Bedroom |
| Vayu | वायु | Living, study |
| Akash | आकाश | Courtyard, puja, open zones |

## Canvas overlay

When the Vastu tool is active, an 8-sector radial overlay is drawn at plan centroid with sector labels (N, NE, …) color-coded by score.

## Integration points

- Optimization: `vastu_harmonized` strategy (see Design Optimization Engine)
- PDF export: Vastu summary page when jurisdiction is India or Vastu data present
- AI planning: post-layout Vastu bullets when `jurisdiction === 'in'`

## Tests

- `src/core/simulations/vastu.test.ts`
- `src/core/simulations/panchatattva.test.ts`
