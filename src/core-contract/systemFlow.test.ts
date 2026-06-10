import { afterEach, describe, expect, it } from 'vitest';
import {
  assertAllowedFlow,
  clearRecordedSystemFlows,
  getRecordedSystemFlows,
} from '@/core-contract/systemFlow';

describe('systemFlow', () => {
  afterEach(() => {
    clearRecordedSystemFlows();
  });

  it('allows registered module edges', () => {
    expect(() => assertAllowedFlow('ARCHITECTURE_COPILOT', 'OPTIMIZATION_ENGINE')).not.toThrow();
    expect(() => assertAllowedFlow('OPTIMIZATION_ENGINE', 'COMPLIANCE_GATE')).not.toThrow();
    expect(() => assertAllowedFlow('GENERATED_BUILDING', 'COST_INTELLIGENCE')).not.toThrow();
    expect(getRecordedSystemFlows().length).toBe(3);
  });

  it('throws on forbidden edges', () => {
    expect(() => assertAllowedFlow('COST_INTELLIGENCE', 'layoutSolver')).toThrow(
      '[SYSTEM_DRIFT_BLOCKED] Forbidden flow: COST_INTELLIGENCE→layoutSolver',
    );
    expect(() => assertAllowedFlow('COMPLIANCE_GATE', 'layoutSolver')).toThrow(
      '[SYSTEM_DRIFT_BLOCKED] Forbidden flow: COMPLIANCE_GATE→layoutSolver',
    );
  });

  it('throws on unregistered module edges', () => {
    expect(() => assertAllowedFlow('OPTIMIZATION_ENGINE', 'ARCHITECTURE_COPILOT')).toThrow(
      '[SYSTEM_DRIFT_BLOCKED] Unregistered flow',
    );
  });
});
