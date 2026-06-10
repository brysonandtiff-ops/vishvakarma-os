import type {
  CollaborativeEntity,
  CollaborativeEntityType,
  AnnotationPayload,
} from '@/collaboration/types';
import type {
  DimensionAnnotation,
  Label,
  Opening,
  ProjectManifest,
  Roof,
  Room,
  Wall,
} from '@/types';

export function openingToEntityType(opening: Opening): CollaborativeEntityType | null {
  return opening.type === 'window' ? 'window' : null;
}

export function manifestToCollaborativeEntities(
  manifest: ProjectManifest,
  updatedBy = 'system'
): CollaborativeEntity[] {
  const now = Date.now();
  const entities: CollaborativeEntity[] = [];

  for (const wall of manifest.walls) {
    entities.push({
      id: wall.id,
      type: 'wall',
      floorIndex: wall.floorIndex,
      data: wall,
      updatedAt: now,
      updatedBy,
    });
  }

  for (const room of manifest.rooms ?? []) {
    entities.push({
      id: room.id,
      type: 'room',
      data: room,
      updatedAt: now,
      updatedBy,
    });
  }

  for (const opening of manifest.openings) {
    if (opening.type === 'window') {
      entities.push({
        id: opening.id,
        type: 'window',
        data: opening,
        updatedAt: now,
        updatedBy,
      });
    }
  }

  for (const roof of manifest.roofs ?? []) {
    entities.push({
      id: roof.id,
      type: 'roof',
      floorIndex: roof.floorIndex,
      data: roof,
      updatedAt: now,
      updatedBy,
    });
  }

  for (const dimension of manifest.dimensions ?? []) {
    entities.push({
      id: dimension.id,
      type: 'annotation',
      data: { kind: 'dimension', data: dimension } satisfies AnnotationPayload,
      updatedAt: now,
      updatedBy,
    });
  }

  for (const label of manifest.labels ?? []) {
    entities.push({
      id: label.id,
      type: 'annotation',
      data: { kind: 'label', data: label } satisfies AnnotationPayload,
      updatedAt: now,
      updatedBy,
    });
  }

  return entities;
}

export function isWallEntity(entity: CollaborativeEntity): entity is CollaborativeEntity & { data: Wall } {
  return entity.type === 'wall';
}

export function isRoomEntity(entity: CollaborativeEntity): entity is CollaborativeEntity & { data: Room } {
  return entity.type === 'room';
}

export function isWindowEntity(entity: CollaborativeEntity): entity is CollaborativeEntity & { data: Opening } {
  return entity.type === 'window';
}

export function isRoofEntity(entity: CollaborativeEntity): entity is CollaborativeEntity & { data: Roof } {
  return entity.type === 'roof';
}

export function isAnnotationEntity(
  entity: CollaborativeEntity
): entity is CollaborativeEntity & { data: AnnotationPayload } {
  return entity.type === 'annotation';
}

export function annotationFromPayload(payload: AnnotationPayload): DimensionAnnotation | Label {
  return payload.data;
}
