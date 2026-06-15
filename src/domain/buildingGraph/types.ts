import type { ProjectManifest } from '@/types';

export type BuildingElementKind =
  | 'wall'
  | 'opening'
  | 'room'
  | 'floor'
  | 'staircase'
  | 'fixture'
  | 'furniture'
  | 'label';

export type BuildingGraphEdgeKind = 'hosts' | 'bounds' | 'connects' | 'on-floor';

export interface BuildingElementRef {
  kind: BuildingElementKind;
  id: string;
}

export interface BuildingGraphNode {
  id: string;
  kind: BuildingElementKind;
  manifestRef: BuildingElementRef;
  floorIndex: number;
  label?: string;
  props: Record<string, unknown>;
}

export interface BuildingGraphEdge {
  id: string;
  kind: BuildingGraphEdgeKind;
  from: string;
  to: string;
}

export interface BuildingGraph {
  version: '0.1';
  manifestVersion: string;
  projectName: string;
  nodes: BuildingGraphNode[];
  edges: BuildingGraphEdge[];
}

export interface BuildingGraphStats {
  walls: number;
  openings: number;
  rooms: number;
  floors: number;
  staircases: number;
  fixtures: number;
  furniture: number;
}
