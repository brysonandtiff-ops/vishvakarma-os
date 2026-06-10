import { DEFAULT_ADJACENCY_RULES, type AdjacencyRule } from '@/domain/rooms/adjacencyRule';
import type { ArchitectureMapGraph } from '@/domain/buildings/generatedBuilding';
import type { OptimizationStrategy } from '@/domain/optimization/types';
import type { RoomType } from '@/domain/rooms/roomType';
import type { RoomSpec } from '@/ai/building-designer/generators/constraintEngine';

function ruleKey(a: RoomType, b: RoomType) {
  return [a, b].sort().join('|');
}

export function buildAdjacencyWeights(
  rules: AdjacencyRule[] = DEFAULT_ADJACENCY_RULES,
  strategy?: OptimizationStrategy,
) {
  const map = new Map<string, number>();
  for (const rule of rules) {
    const key = ruleKey(rule.roomA, rule.roomB);
    map.set(key, rule.avoid ? -Math.abs(rule.weight) : rule.weight);
  }

  if (strategy?.adjacencyMultipliers) {
    for (const mult of strategy.adjacencyMultipliers) {
      const key = ruleKey(mult.roomA, mult.roomB);
      const base = map.get(key) ?? 0;
      if (base > 0) {
        map.set(key, base * mult.multiplier);
      } else if (base === 0) {
        map.set(key, 5 * mult.multiplier);
      }
    }
  }

  return map;
}

export function scoreAdjacency(
  typeA: RoomType,
  typeB: RoomType,
  weights = buildAdjacencyWeights(),
): number {
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

const DEFAULT_ROOM_PRIORITY: Partial<Record<RoomType, number>> = {
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

export function sortRoomsForPlacement(rooms: RoomSpec[], strategy?: OptimizationStrategy): RoomSpec[] {
  const priority = { ...DEFAULT_ROOM_PRIORITY, ...strategy?.roomPriority };

  return [...rooms].sort((a, b) => (priority[a.type] ?? 20) - (priority[b.type] ?? 20));
}
