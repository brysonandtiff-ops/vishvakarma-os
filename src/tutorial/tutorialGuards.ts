import type { EditorTutorialSnapshot, TutorialGate } from './types';

const GATE_HINTS: Record<TutorialGate, string> = {
  'tool:wall': 'Select Wall (W) to continue',
  'tool:door': 'Select Door (D) to continue',
  'tool:window': 'Select Window (N) to continue',
  'tool:label': 'Select Label (T) to continue',
  'geometry:wall': 'Draw at least one wall to continue',
  'geometry:opening': 'Place a door or window to continue',
  'view:3d': 'Open the 3D preview to continue',
  'project:saved': 'Save your project to continue',
  'dialog:export-open': 'Open the Export dialog to continue',
  'mode:interior': 'Switch to Interior mode to continue',
  'mode:mep': 'Switch to MEP mode to continue',
  'mode:draft': 'Switch to Draft mode to continue',
};

export function getGateHint(gate: TutorialGate, override?: string) {
  return override ?? GATE_HINTS[gate];
}

export function isGateSatisfied(gate: TutorialGate, snapshot: EditorTutorialSnapshot): boolean {
  switch (gate) {
    case 'tool:wall':
      return snapshot.currentTool === 'wall';
    case 'tool:door':
      return snapshot.currentTool === 'door';
    case 'tool:window':
      return snapshot.currentTool === 'window';
    case 'tool:label':
      return snapshot.currentTool === 'text';
    case 'geometry:wall':
      return snapshot.wallsCount >= 1;
    case 'geometry:opening':
      return snapshot.openingsCount >= 1;
    case 'view:3d':
      return snapshot.show3DView;
    case 'project:saved':
      return !snapshot.hasUnsavedChanges;
    case 'dialog:export-open':
      return snapshot.exportDialogOpen;
    case 'mode:interior':
      return snapshot.workspaceMode === 'interior';
    case 'mode:mep':
      return snapshot.workspaceMode === 'mep';
    case 'mode:draft':
      return snapshot.workspaceMode === 'draft';
    default:
      return false;
  }
}
