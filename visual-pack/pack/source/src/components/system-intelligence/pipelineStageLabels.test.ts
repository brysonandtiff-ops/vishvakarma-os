import { describe, expect, it } from 'vitest';
import {
  COMPUTE_STATUS_MESSAGES,
  MACRO_STEPS,
  getCompletedMacroSteps,
  pipelineStageToComputeStatus,
  pipelineStageToMacro,
} from '@/components/system-intelligence/pipelineStageLabels';

describe('pipelineStageLabels', () => {
  it('maps micro stages to macro steps', () => {
    expect(pipelineStageToMacro('extracting')).toBe('Input');
    expect(pipelineStageToMacro('layout')).toBe('Generate');
    expect(pipelineStageToMacro('scoring')).toBe('Optimize');
    expect(pipelineStageToMacro('compliance')).toBe('Compliance');
    expect(pipelineStageToMacro('complete')).toBe('Export');
  });

  it('maps stages to compute status messages', () => {
    expect(pipelineStageToComputeStatus('layout')).toBe('running');
    expect(pipelineStageToComputeStatus('floorplan')).toBe('cost');
    expect(pipelineStageToComputeStatus('compliance')).toBe('compliance');
    expect(pipelineStageToComputeStatus('scoring')).toBe('scoring');
    expect(pipelineStageToComputeStatus('complete')).toBe('done');
    expect(COMPUTE_STATUS_MESSAGES.scoring).toBe('Ranking candidates…');
  });

  it('returns completed macro steps before active step', () => {
    expect(getCompletedMacroSteps('Compliance')).toEqual([
      'Input',
      'Generate',
      'Optimize',
      'CostModel',
    ]);
    expect(getCompletedMacroSteps(MACRO_STEPS[0])).toEqual([]);
  });
});
