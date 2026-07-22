import { describe, expect, it } from 'vitest';
import { aggregateComplianceResults } from '@/services/compliance/complianceAggregator';
import type { ComplianceResult } from '@/rules/types';

describe('complianceAggregator', () => {
  it('rolls up category and overall status with fail > warning > pass', () => {
    const results: ComplianceResult[] = [
      {
        ruleId: 'ncc-bedroom-size',
        category: 'ncc',
        status: 'pass',
        description: 'Bedroom size',
        findings: [],
      },
      {
        ruleId: 'zoning-setback',
        category: 'zoning',
        status: 'fail',
        description: 'Setback',
        findings: [{ ruleId: 'zoning-setback', category: 'zoning', status: 'fail', message: 'Setback violation' }],
      },
      {
        ruleId: 'energy-thermal',
        category: 'energy',
        status: 'warning',
        description: 'Thermal',
        findings: [{ ruleId: 'energy-thermal', category: 'energy', status: 'warning', message: 'Low comfort' }],
      },
    ];

    const report = aggregateComplianceResults(results, { projectId: 'p1', projectName: 'Test' });
    expect(report.overall).toBe('fail');
    expect(report.blocked).toBe(true);
    expect(report.categories.find((c) => c.category === 'zoning')?.status).toBe('fail');
    expect(report.categories.find((c) => c.category === 'energy')?.status).toBe('warning');
    expect(report.categories.find((c) => c.category === 'ncc')?.status).toBe('pass');
  });
});
