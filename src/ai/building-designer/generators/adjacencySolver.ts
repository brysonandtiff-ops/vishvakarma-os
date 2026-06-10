import { DEFAULT_ADJACENCY_RULES, type AdjacencyRule } from '@/domain/rooms/adjacencyRule';
import type { ArchitectureMapGraph } from '@/domain/buildings/generatedBuilding';
import type { RoomType } from '@/domain/rooms/roomType';
import type { RoomSpec } from '@/ai/building-designer/generators/constraintEngine';

function ruleKey(a: RoomType, b: RoomType) {
  return [a, b].sort().join('|');
}

export function buildAdjacencyWeights(rules: AdjacencyRule[] = DEFAULT_ADJACENCY_RULES) {
  const map = new Map<string, number>();
  for (const rule of rules) {
    const key = ruleKey(rule.roomA, rule.roomB);
    map.set(key, rule.avoid ? -Math.abs(rule.weight) : rule.weight);
  }
  return map;
}

export function scoreAdjacency(typeA: RoomType, typeB: RoomType, weights = buildAdjacencyWeights()): number {
  return weights.get(ruleKey(typeA, typeB)) ?? 0;
}

export function buildArchitectureMap(rooms: RoomSpec[]): ArchitectureMapGraph {
  const nodes = rooms.map((r) => ({ id: r.id, label: r.label, type: r.type }));
  const edges: ArchitectureMapGraph['edges'] = [];

  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const weight = scoreAdjacency(rooms[i].type, rooms[j].type);
      if (weight !== 0) {
        edges.push({ from: rooms[i].id, to: rooms[j].id, weight });
      }
    }
  }

  return { nodes, edges };
}

export function sortRoomsForPlacement(rooms: RoomSpec[]): RoomSpec[] {
  const priority: Partial<Record<RoomType, number>> = {
    Garage: 1,
    Living: 2,
    Kitchen: 3,
    Dining: 4,
    Entry: 5,
    Hallway: 6,
    MasterBedroom: 7,
    Bedroom: 8,
    Bathroom: 9,
    Ensuite: 9,
    Laundry: 10,
    Mudroom: 10,
    Study: 11,
  };

  return [...rooms].sort((a, b) => (priority[a.type] ?? 20) - (priority[b.type] ?? 20));
}
