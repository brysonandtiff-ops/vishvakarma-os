import { describe, expect, it } from 'vitest';
import { validateBuildGate } from '@/core-contract/build-gate.schema';

describe('validateBuildGate', () => {
  it('requires revalidation when touchesCore', () => {
    const errors = validateBuildGate({
      touchesCore: true,
      modifiesPipeline: true,
      affectsCompliance: false,
      affectsCostModel: false,
      requiresRevalidation: false,
    });
    expect(errors).toContain('touchesCore=true requires requiresRevalidation=true');
  });

  it('requires revalidation when affectsCompliance', () => {
    const errors = validateBuildGate({
      touchesCore: false,
      modifiesPipeline: false,
      affectsCompliance: true,
      affectsCostModel: false,
      requiresRevalidation: false,
    });
    expect(errors).toContain('affectsCompliance=true requires requiresRevalidation=true');
  });

  it('requires valuation impact when affectsCostModel', () => {
    const errors = validateBuildGate({
      touchesCore: false,
      modifiesPipeline: false,
      affectsCompliance: false,
      affectsCostModel: true,
      requiresRevalidation: true,
    });
    expect(errors).toContain('affectsCostModel=true requires valuationImpact.reason');
  });

  it('passes a valid gate declaration', () => {
    const errors = validateBuildGate({
      touchesCore: true,
      modifiesPipeline: true,
      affectsCompliance: false,
      affectsCostModel: false,
      requiresRevalidation: true,
    });
    expect(errors).toHaveLength(0);
  });
});
