import { describe, expect, it } from 'vitest';
import { parseDxfBoundary, boundaryMetricsFromPolygon } from '@/services/copilot/ingestion/dxfBoundaryParser';

const SAMPLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
BOUNDARY
10
0
20
0
11
400
21
0
0
LINE
8
BOUNDARY
10
400
20
0
11
400
21
400
0
LINE
8
BOUNDARY
10
400
20
400
11
0
21
400
0
LINE
8
BOUNDARY
10
0
20
400
11
0
21
0
0
ENDSEC
0
EOF`;

describe('dxfBoundaryParser', () => {
  it('parses LINE entities into boundary polygon', () => {
    const polygon = parseDxfBoundary(SAMPLE_DXF);
    expect(polygon.length).toBeGreaterThanOrEqual(4);
  });

  it('computes boundary metrics from polygon', () => {
    const polygon = parseDxfBoundary(SAMPLE_DXF);
    const metrics = boundaryMetricsFromPolygon(polygon);
    expect(metrics.areaSqM).toBeGreaterThan(0);
    expect(metrics.widthM).toBeGreaterThan(0);
    expect(metrics.depthM).toBeGreaterThan(0);
  });
});
