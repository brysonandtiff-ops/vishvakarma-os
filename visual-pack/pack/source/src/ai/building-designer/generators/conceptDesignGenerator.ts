import type { ArchitectureMapGraph } from '@/domain/buildings/generatedBuilding';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedFloorPlan } from '@/domain/buildings/generatedBuilding';
import type { ConceptDesign } from '@/domain/copilot/conceptDesign';
import { PX_PER_METER } from '@/domain/constants';

function pxToM(px: number) {
  return Math.round((px / PX_PER_METER) * 100) / 100;
}

export function generateConceptDesign(
  request: BuildingRequest,
  floorPlan: GeneratedFloorPlan,
  architectureMap: ArchitectureMapGraph,
): ConceptDesign {
  const roomProgram = floorPlan.rooms.map((room) => ({
    id: room.id,
    label: room.label,
    type: room.type,
    areaSqM: pxToM(room.width) * pxToM(room.depth),
  }));

  const adjacencyNotes = architectureMap.edges.slice(0, 8).map((edge) => {
    const from = architectureMap.nodes.find((n) => n.id === edge.from);
    const to = architectureMap.nodes.find((n) => n.id === edge.to);
    return `${from?.label ?? edge.from} connects to ${to?.label ?? edge.to}`;
  });

  return {
    styleSummary: `${request.style} ${request.bedrooms}-bedroom ${request.levels > 1 ? 'two-storey' : 'single-storey'} residence`,
    designIntent: `Optimised for a ${request.parcel.area}m² lot with ${request.garageSpaces}-car garage and ${request.bathrooms} bathrooms.`,
    roomProgram,
    adjacencyNotes,
    massingNotes: `Building massing respects ${request.parcel.orientation} orientation with ${request.parcel.slope}% site slope.`,
  };
}
