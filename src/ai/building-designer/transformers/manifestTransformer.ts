import type {
  ArchitectureMapGraph,
  BuildingSchedules,
  GeneratedFloorPlan,
  SitePlan,
} from '@/domain/buildings/generatedBuilding';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { OptimizationManifestMetadata } from '@/domain/optimization/types';
import { createProjectManifest } from '@/core/projectModel';
import { validateManifest } from '@/core/manifestSchema';
import { stampSystemMetadata } from '@/core-contract/systemVersions';
import type { Label, ProjectManifest, Room } from '@/types';

export interface AIDesignerMetadata {
  prompt: string;
  request: BuildingRequest;
  sitePlan: SitePlan;
  schedules: BuildingSchedules;
  architectureMap: ArchitectureMapGraph;
  generatedAt: string;
}

export function buildManifestFromFloorPlan(
  floorPlan: GeneratedFloorPlan,
  request: BuildingRequest,
  meta: Omit<AIDesignerMetadata, 'request' | 'sitePlan' | 'schedules' | 'architectureMap'> & {
    request: BuildingRequest;
    sitePlan: SitePlan;
    schedules: BuildingSchedules;
    architectureMap: ArchitectureMapGraph;
    copilot?: CopilotManifestMetadata;
    optimization?: OptimizationManifestMetadata;
  },
): ProjectManifest {
  const labels: Label[] = floorPlan.rooms.map((room) => ({
    id: `label-${room.id}`,
    text: room.label,
    position: { x: room.x + room.width / 2, y: room.y + room.depth / 2 },
  }));

  const rooms: Room[] = floorPlan.rooms.map((room) => ({
    id: room.id,
    name: room.label,
    wallIds: floorPlan.walls
      .filter((wall) => {
        const mid = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
        return (
          mid.x >= room.x - 2 &&
          mid.x <= room.x + room.width + 2 &&
          mid.y >= room.y - 2 &&
          mid.y <= room.y + room.depth + 2
        );
      })
      .map((w) => w.id),
    center: { x: room.x + room.width / 2, y: room.y + room.depth / 2 },
    area: (room.width / 20) * (room.depth / 20),
  }));

  const name = `${request.bedrooms}BR ${request.style} home`;
  const manifest = createProjectManifest({
    name,
    description: `AI-generated ${request.style} residence`,
    walls: floorPlan.walls,
    openings: floorPlan.openings,
  });

  const enriched: ProjectManifest = {
    ...manifest,
    labels,
    rooms,
    metadata: stampSystemMetadata({
      ...manifest.metadata,
      aiDesigner: meta as unknown as Record<string, unknown>,
      ...(meta.copilot ? { copilot: meta.copilot as unknown as Record<string, unknown> } : {}),
      ...(meta.optimization
        ? { optimization: meta.optimization as unknown as Record<string, unknown> }
        : {}),
    }),
  };

  const validation = validateManifest(enriched);
  if (!validation.valid) {
    throw new Error(`Generated manifest invalid: ${validation.errors[0]?.message ?? 'unknown'}`);
  }

  return enriched;
}
