import type { PipelineStage } from '@/core-contract/pipeline.schema';
import { PIPELINE_STAGE_ORDER } from '@/core-contract/pipeline.schema';

export type MacroStep = 'Input' | 'Generate' | 'Optimize' | 'CostModel' | 'Compliance' | 'Export';

export type ComputeStatus = 'running' | 'cost' | 'compliance' | 'scoring' | 'done';

export const MACRO_STEPS: MacroStep[] = [
  'Input',
  'Generate',
  'Optimize',
  'CostModel',
  'Compliance',
  'Export',
];

export const MICRO_STAGE_LABELS: Record<PipelineStage, string> = {
  ingesting: 'Ingesting',
  extracting: 'Extracting',
  constraints: 'Constraints',
  concept: 'Concept',
  layout: 'Layout',
  floorplan: 'Floor plan',
  schedules: 'Schedules',
  compliance: 'Compliance',
  complete: 'Complete',
  error: 'Error',
};

const STAGE_TO_MACRO: Record<PipelineStage, MacroStep> = {
  ingesting: 'Input',
  extracting: 'Input',
  constraints: 'Generate',
  concept: 'Generate',
  layout: 'Generate',
  floorplan: 'Generate',
  schedules: 'CostModel',
  compliance: 'Compliance',
  complete: 'Export',
  error: 'Export',
};

/** Optimization batch uses a pseudo-stage for ranking. */
export type ExtendedPipelineStage = PipelineStage | 'scoring';

export function pipelineStageToMacro(stage: PipelineStage | 'scoring'): MacroStep {
  if (stage === 'scoring') return 'Optimize';
  return STAGE_TO_MACRO[stage];
}

export function pipelineStageToComputeStatus(stage: PipelineStage | 'scoring' | null): ComputeStatus {
  if (!stage) return 'running';
  if (stage === 'scoring') return 'scoring';
  if (stage === 'complete') return 'done';
  if (stage === 'compliance') return 'compliance';
  if (stage === 'schedules' || stage === 'floorplan') return 'cost';
  if (stage === 'error') return 'done';
  return 'running';
}

export const COMPUTE_STATUS_MESSAGES: Record<ComputeStatus, string> = {
  running: 'Computing layouts…',
  cost: 'Running cost simulation…',
  compliance: 'Checking NCC rules…',
  scoring: 'Ranking candidates…',
  done: 'Ready',
};

export function getMicroStageLabel(stage: PipelineStage): string {
  return MICRO_STAGE_LABELS[stage];
}

export function getCompletedMacroSteps(activeMacro: MacroStep): MacroStep[] {
  const idx = MACRO_STEPS.indexOf(activeMacro);
  if (idx <= 0) return [];
  return MACRO_STEPS.slice(0, idx);
}

export function getCompletedMicroStages(activeStage: PipelineStage): PipelineStage[] {
  const idx = PIPELINE_STAGE_ORDER.indexOf(activeStage);
  if (idx <= 0) return [];
  return PIPELINE_STAGE_ORDER.slice(0, idx);
}

export function isMacroStepComplete(step: MacroStep, active: MacroStep, completed?: MacroStep[]): boolean {
  if (completed?.includes(step)) return true;
  const activeIdx = MACRO_STEPS.indexOf(active);
  const stepIdx = MACRO_STEPS.indexOf(step);
  return stepIdx < activeIdx;
}

export function isMicroStageComplete(stage: PipelineStage, active: PipelineStage, completed?: PipelineStage[]): boolean {
  if (completed?.includes(stage)) return true;
  const activeIdx = PIPELINE_STAGE_ORDER.indexOf(active);
  const stageIdx = PIPELINE_STAGE_ORDER.indexOf(stage);
  return stageIdx < activeIdx;
}
