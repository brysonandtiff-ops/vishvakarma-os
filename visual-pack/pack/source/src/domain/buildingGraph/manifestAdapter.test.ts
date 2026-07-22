import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildingGraphStats,
  manifestToBuildingGraph,
  validateBuildingGraphParity,
} from '@/domain/buildingGraph/manifestAdapter';
import { createProjectManifest } from '@/core/projectModel';

describe('manifestToBuildingGraph', () => {
  it('maps walls and openings with host edges', () => {
    const manifest = createProjectManifest({
      name: 'Graph Test',
      walls: [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thickness: 10,
          height: 240,
          material: 'material-paint',
        },
      ],
      openings: [
        {
          id: 'd1',
          type: 'door',
          wallId: 'w1',
          position: 0.5,
          width: 90,
          height: 210,
        },
      ],
    });

    const graph = manifestToBuildingGraph(manifest);
    expect(graph.version).toBe('0.1');
    expect(graph.nodes.filter((n) => n.kind === 'wall')).toHaveLength(1);
    expect(graph.nodes.filter((n) => n.kind === 'opening')).toHaveLength(1);
    expect(graph.edges.filter((e) => e.kind === 'hosts')).toHaveLength(1);
    expect(validateBuildingGraphParity(manifest, graph)).toEqual([]);
  });

  it('matches sample manifest element counts', () => {
    const samplePath = resolve(process.cwd(), 'public/samples/sample-house-01.json');
    const manifest = JSON.parse(readFileSync(samplePath, 'utf8'));
    const graph = manifestToBuildingGraph(manifest);
    const stats = buildingGraphStats(manifest);

    expect(graph.nodes.filter((n) => n.kind === 'wall')).toHaveLength(stats.walls);
    expect(graph.nodes.filter((n) => n.kind === 'opening')).toHaveLength(stats.openings);
    expect(validateBuildingGraphParity(manifest, graph)).toEqual([]);
  });
});
