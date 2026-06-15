import { describe, expect, it } from 'vitest';
import { createProjectManifest } from '@/core/projectModel';
import { countActionableIssues, scanArchitectureIssues } from '@/services/architecture-bot/scanIssues';

describe('scanArchitectureIssues', () => {
  it('flags empty projects as informational', () => {
    const manifest = createProjectManifest({ name: 'Empty' });
    const issues = scanArchitectureIssues(manifest);
    expect(issues.some((issue) => issue.id === 'structure-empty-project')).toBe(true);
    expect(countActionableIssues(issues)).toBeGreaterThan(0);
  });

  it('detects low wall height compliance failures', () => {
    const manifest = {
      ...createProjectManifest({
        name: 'Low walls',
        walls: [
          {
            id: 'w1',
            start: { x: 0, y: 0 },
            end: { x: 200, y: 0 },
            thickness: 10,
            height: 40,
            material: 'material-concrete',
          },
        ],
      }),
      jurisdiction: 'au' as const,
    };

    const issues = scanArchitectureIssues(manifest);
    expect(issues.some((issue) => issue.ruleId === 'ncc-habitable-height')).toBe(true);
  });

  it('flags missing rooms when walls exist without room labels', () => {
    const manifest = createProjectManifest({
      name: 'Walls only',
      walls: [
        { id: 'w1', start: { x: 0, y: 0 }, end: { x: 200, y: 0 }, thickness: 10, height: 240, material: 'm' },
        { id: 'w2', start: { x: 200, y: 0 }, end: { x: 200, y: 200 }, thickness: 10, height: 240, material: 'm' },
        { id: 'w3', start: { x: 200, y: 200 }, end: { x: 0, y: 200 }, thickness: 10, height: 240, material: 'm' },
        { id: 'w4', start: { x: 0, y: 200 }, end: { x: 0, y: 0 }, thickness: 10, height: 240, material: 'm' },
      ],
    });

    const issues = scanArchitectureIssues(manifest);
    expect(issues.some((issue) => issue.ruleId === 'structure-missing-rooms')).toBe(true);
  });
});

describe('countActionableIssues', () => {
  it('counts auto-fixable info issues', () => {
    const manifest = createProjectManifest({ name: 'No jurisdiction' });
    const issues = scanArchitectureIssues(manifest);
    expect(countActionableIssues(issues)).toBeGreaterThan(0);
  });
});
