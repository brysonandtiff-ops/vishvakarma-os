# RFC 001: Curved Walls

## Problem

Rectilinear walls only; users request arcs for bay windows and organic layouts.

## Proposal

Add `WallSegment` union: `line | arc` with center, radius, startAngle, endAngle.

## Impact

BlueprintCanvas draw loop, 3D extrusion, DXF export, save/load schema v1.2+.

## Status

Proposed — not scheduled until v2.1.
