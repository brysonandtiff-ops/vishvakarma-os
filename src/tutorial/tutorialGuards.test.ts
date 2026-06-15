import { describe, expect, it } from 'vitest';
import { getGateHint, isGateSatisfied } from './tutorialGuards';
import { EMPTY_EDITOR_SNAPSHOT } from './types';

describe('tutorialGuards', () => {
  it('evaluates tool and geometry gates', () => {
    expect(isGateSatisfied('tool:wall', { ...EMPTY_EDITOR_SNAPSHOT, currentTool: 'wall' })).toBe(true);
    expect(isGateSatisfied('geometry:wall', { ...EMPTY_EDITOR_SNAPSHOT, wallsCount: 2 })).toBe(true);
    expect(isGateSatisfied('geometry:opening', { ...EMPTY_EDITOR_SNAPSHOT, openingsCount: 1 })).toBe(true);
    expect(isGateSatisfied('view:3d', { ...EMPTY_EDITOR_SNAPSHOT, show3DView: true })).toBe(true);
  });

  it('evaluates mode and dialog gates', () => {
    expect(isGateSatisfied('mode:interior', { ...EMPTY_EDITOR_SNAPSHOT, workspaceMode: 'interior' })).toBe(true);
    expect(isGateSatisfied('dialog:export-open', { ...EMPTY_EDITOR_SNAPSHOT, exportDialogOpen: true })).toBe(true);
    expect(isGateSatisfied('project:saved', { ...EMPTY_EDITOR_SNAPSHOT, hasUnsavedChanges: false })).toBe(true);
  });

  it('returns actionable gate hints', () => {
    expect(getGateHint('tool:wall')).toMatch(/Wall/i);
    expect(getGateHint('geometry:wall', 'Custom hint')).toBe('Custom hint');
  });
});
