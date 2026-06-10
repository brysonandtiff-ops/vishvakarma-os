/**
 * Pipeline stage contract — allowed transitions for generation pipelines.
 */

export type PipelineStage =
  | 'ingesting'
  | 'extracting'
  | 'constraints'
  | 'concept'
  | 'layout'
  | 'floorplan'
  | 'schedules'
  | 'compliance'
  | 'complete'
  | 'error';

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'ingesting',
  'extracting',
  'constraints',
  'concept',
  'layout',
  'floorplan',
  'schedules',
  'compliance',
  'complete',
];

/** Canonical system graph stage sequence (post-input). */
export const SYSTEM_PIPELINE_GRAPH: string[] = [
  'INPUT',
  'ARCHITECTURE_COPILOT',
  'OPTIMIZATION_ENGINE',
  'COMPLIANCE_GATE',
  'PERMIT_PACKAGE_EXPORT',
  'COST_INTELLIGENCE',
];

export interface PipelineStageContract {
  stage: PipelineStage;
  module: 'ARCHITECTURE_COPILOT' | 'OPTIMIZATION_ENGINE';
  outputs: Array<'BuildingRequest' | 'GeneratedFloorPlan' | 'ComplianceAuditReport' | 'CostSummary'>;
}

export function isAllowedStageTransition(from: PipelineStage, to: PipelineStage): boolean {
  if (to === 'error') return true;
  const fromIdx = PIPELINE_STAGE_ORDER.indexOf(from);
  const toIdx = PIPELINE_STAGE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1 || to === from;
}
