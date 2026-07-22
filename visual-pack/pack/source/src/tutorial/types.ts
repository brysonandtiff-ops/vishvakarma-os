export type TutorialPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type TutorialGate =
  | 'tool:wall'
  | 'tool:door'
  | 'tool:window'
  | 'tool:label'
  | 'geometry:wall'
  | 'geometry:opening'
  | 'view:3d'
  | 'project:saved'
  | 'dialog:export-open'
  | 'mode:interior'
  | 'mode:mep'
  | 'mode:draft';

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
  route?: string;
  placement?: TutorialPlacement;
  gate?: TutorialGate;
  gateHint?: string;
  optionalAction?: string;
  spotlightPadding?: number;
};

export type TutorialTrackStyle = 'hands-on' | 'spotlight' | 'hybrid';

export type TutorialTrack = {
  id: string;
  title: string;
  description: string;
  estMinutes: number;
  style: TutorialTrackStyle;
  defaultRoute: string;
  steps: TutorialStep[];
};

export type TutorialProgress = {
  completed: string[];
  lastStep: Record<string, string>;
  lastActiveTrackId?: string;
};

export type EditorTutorialSnapshot = {
  currentTool: string;
  wallsCount: number;
  openingsCount: number;
  show3DView: boolean;
  hasUnsavedChanges: boolean;
  exportDialogOpen: boolean;
  workspaceMode: string;
  labelsCount: number;
  dimensionsCount: number;
};

export const EMPTY_EDITOR_SNAPSHOT: EditorTutorialSnapshot = {
  currentTool: 'select',
  wallsCount: 0,
  openingsCount: 0,
  show3DView: false,
  hasUnsavedChanges: false,
  exportDialogOpen: false,
  workspaceMode: 'draft',
  labelsCount: 0,
  dimensionsCount: 0,
};
