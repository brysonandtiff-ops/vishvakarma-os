import type {
  BuildingGraph,
  BuildingGraphEdge,
  BuildingGraphNode,
  BuildingGraphStats,
} from '@/domain/buildingGraph/types';
import type { ProjectManifest } from '@/types';

function nodeId(kind: string, id: string): string {
  return `${kind}:${id}`;
}

function wallFloorIndex(wall: { floorIndex?: number }, manifest: ProjectManifest): number {
  return wall.floorIndex ?? manifest.activeFloorIndex ?? 0;
}

export function manifestToBuildingGraph(manifest: ProjectManifest): BuildingGraph {
  const nodes: BuildingGraphNode[] = [];
  const edges: BuildingGraphEdge[] = [];

  for (const wall of manifest.walls) {
    const floorIndex = wallFloorIndex(wall, manifest);
    nodes.push({
      id: nodeId('wall', wall.id),
      kind: 'wall',
      manifestRef: { kind: 'wall', id: wall.id },
      floorIndex,
      props: {
        thickness: wall.thickness,
        height: wall.height,
        material: wall.material,
      },
    });
  }

  for (const opening of manifest.openings) {
    nodes.push({
      id: nodeId('opening', opening.id),
      kind: 'opening',
      manifestRef: { kind: 'opening', id: opening.id },
      floorIndex: manifest.walls.find((w) => w.id === opening.wallId)?.floorIndex
        ?? manifest.activeFloorIndex
        ?? 0,
      label: opening.type,
      props: {
        type: opening.type,
        width: opening.width,
        height: opening.height,
        position: opening.position,
      },
    });
    edges.push({
      id: `hosts:${opening.id}`,
      kind: 'hosts',
      from: nodeId('opening', opening.id),
      to: nodeId('wall', opening.wallId),
    });
  }

  for (const room of manifest.rooms ?? []) {
    nodes.push({
      id: nodeId('room', room.id),
      kind: 'room',
      manifestRef: { kind: 'room', id: room.id },
      floorIndex: room.floorIndex ?? manifest.activeFloorIndex ?? 0,
      label: room.name,
      props: {
        roomType: room.roomType,
        area: room.area,
        wallIds: room.wallIds,
      },
    });
    for (const wallId of room.wallIds) {
      edges.push({
        id: `bounds:${room.id}:${wallId}`,
        kind: 'bounds',
        from: nodeId('room', room.id),
        to: nodeId('wall', wallId),
      });
    }
  }

  for (const [index, floor] of (manifest.floors ?? []).entries()) {
    nodes.push({
      id: nodeId('floor', floor.id),
      kind: 'floor',
      manifestRef: { kind: 'floor', id: floor.id },
      floorIndex: index,
      label: floor.name,
      props: { elevation: floor.elevation },
    });
  }

  for (const stair of manifest.staircases ?? []) {
    nodes.push({
      id: nodeId('staircase', stair.id),
      kind: 'staircase',
      manifestRef: { kind: 'staircase', id: stair.id },
      floorIndex: stair.floorIndex ?? 0,
      props: {
        position: stair.position,
        direction: stair.direction,
      },
    });
  }

  for (const fixture of manifest.fixtures ?? []) {
    nodes.push({
      id: nodeId('fixture', fixture.id),
      kind: 'fixture',
      manifestRef: { kind: 'fixture', id: fixture.id },
      floorIndex: fixture.floorIndex ?? manifest.activeFloorIndex ?? 0,
      label: fixture.type,
      props: { intensity: fixture.intensity },
    });
  }

  for (const item of manifest.furniture ?? []) {
    nodes.push({
      id: nodeId('furniture', item.id),
      kind: 'furniture',
      manifestRef: { kind: 'furniture', id: item.id },
      floorIndex: item.floorIndex ?? manifest.activeFloorIndex ?? 0,
      label: item.type,
      props: { rotation: item.rotation },
    });
  }

  return {
    version: '0.1',
    manifestVersion: manifest.version,
    projectName: manifest.name,
    nodes,
    edges,
  };
}

export function buildingGraphStats(manifest: ProjectManifest): BuildingGraphStats {
  return {
    walls: manifest.walls.length,
    openings: manifest.openings.length,
    rooms: manifest.rooms?.length ?? 0,
    floors: manifest.floors?.length ?? 0,
    staircases: manifest.staircases?.length ?? 0,
    fixtures: manifest.fixtures?.length ?? 0,
    furniture: manifest.furniture?.length ?? 0,
  };
}

export function validateBuildingGraphParity(manifest: ProjectManifest, graph: BuildingGraph): string[] {
  const stats = buildingGraphStats(manifest);
  const errors: string[] = [];
  const countByKind = (kind: string) => graph.nodes.filter((n) => n.kind === kind).length;

  if (countByKind('wall') !== stats.walls) {
    errors.push(`wall count mismatch: manifest ${stats.walls}, graph ${countByKind('wall')}`);
  }
  if (countByKind('opening') !== stats.openings) {
    errors.push(`opening count mismatch: manifest ${stats.openings}, graph ${countByKind('opening')}`);
  }
  if (countByKind('room') !== stats.rooms) {
    errors.push(`room count mismatch: manifest ${stats.rooms}, graph ${countByKind('room')}`);
  }
  if (countByKind('staircase') !== stats.staircases) {
    errors.push(`staircase count mismatch: manifest ${stats.staircases}, graph ${countByKind('staircase')}`);
  }

  for (const opening of manifest.openings) {
    const hostsEdge = graph.edges.find(
      (e) => e.kind === 'hosts' && e.from === nodeId('opening', opening.id),
    );
    if (!hostsEdge) {
      errors.push(`missing hosts edge for opening ${opening.id}`);
    }
  }

  return errors;
}
