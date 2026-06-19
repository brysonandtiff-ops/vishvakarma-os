import {
  Box,
  Download,
  FileDown,
  FolderOpen,
  Grid3x3,
  Package,
  Plus,
  Save,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/** Surfaces where an editor project action may appear. */
export type EditorActionSurface = 'topbar' | 'sidebar' | 'welcome';

export type EditorProjectActionId =
  | 'newProject'
  | 'openProject'
  | 'save'
  | 'import'
  | 'export'
  | 'loadSample'
  | 'aiDesigner';

export type EditorViewActionId = 'toggle3D' | 'toggleGrid';

export interface EditorActionDef {
  id: EditorProjectActionId | EditorViewActionId;
  label: string;
  /** Shorter label for compact menus (dropdown items without icons). */
  menuLabel?: string;
  icon: LucideIcon;
  testId: string;
  surfaces: EditorActionSurface[];
  /** On coarse pointer / iPad, TopBar Project actions is the primary entry. */
  primaryOnCoarse?: boolean;
}

export const EDITOR_ACTION_LABELS = {
  loadSampleBlueprint: 'Load sample blueprint',
  loadBlueprintCta: 'Load Blueprint',
  loadSampleDialogTitle: 'Load Sample Blueprint',
  projectActions: 'Project actions',
} as const;

export const EDITOR_PROJECT_ACTIONS: EditorActionDef[] = [
  {
    id: 'newProject',
    label: 'New project',
    icon: Plus,
    testId: 'editor-action-new-project',
    surfaces: ['topbar', 'sidebar', 'welcome'],
    primaryOnCoarse: true,
  },
  {
    id: 'openProject',
    label: 'Open project',
    menuLabel: 'Open…',
    icon: FolderOpen,
    testId: 'editor-action-open-project',
    surfaces: ['topbar', 'sidebar'],
    primaryOnCoarse: true,
  },
  {
    id: 'save',
    label: 'Save',
    icon: Save,
    testId: 'editor-action-save',
    surfaces: ['topbar', 'sidebar'],
    primaryOnCoarse: true,
  },
  {
    id: 'import',
    label: 'Import floor plan',
    menuLabel: 'Import',
    icon: Download,
    testId: 'editor-action-import',
    surfaces: ['topbar', 'sidebar'],
  },
  {
    id: 'export',
    label: 'Export floor plan',
    menuLabel: 'Export',
    icon: FileDown,
    testId: 'editor-action-export',
    surfaces: ['topbar', 'sidebar'],
  },
  {
    id: 'loadSample',
    label: EDITOR_ACTION_LABELS.loadSampleBlueprint,
    icon: Package,
    testId: 'editor-action-load-sample',
    surfaces: ['topbar', 'sidebar', 'welcome'],
    primaryOnCoarse: true,
  },
  {
    id: 'aiDesigner',
    label: 'Architecture Copilot',
    icon: Sparkles,
    testId: 'editor-action-ai-designer',
    surfaces: ['topbar', 'sidebar'],
  },
];

export const EDITOR_VIEW_ACTIONS: Omit<EditorActionDef, 'surfaces' | 'primaryOnCoarse'>[] = [
  {
    id: 'toggle3D',
    label: 'Show 3D view',
    icon: Box,
    testId: 'editor-action-toggle-3d',
  },
  {
    id: 'toggleGrid',
    label: 'Show grid',
    icon: Grid3x3,
    testId: 'editor-action-toggle-grid',
  },
];

export function getProjectActionLabel(id: EditorProjectActionId, surface: EditorActionSurface): string {
  const action = EDITOR_PROJECT_ACTIONS.find((entry) => entry.id === id);
  if (!action) return id;
  if (surface === 'topbar' && action.menuLabel) return action.menuLabel;
  return action.label;
}

export function getProjectActionsForSurface(surface: EditorActionSurface): EditorActionDef[] {
  return EDITOR_PROJECT_ACTIONS.filter((action) => action.surfaces.includes(surface));
}

export function getEditorProjectAction(id: EditorProjectActionId): EditorActionDef {
  const action = EDITOR_PROJECT_ACTIONS.find((entry) => entry.id === id);
  if (!action) throw new Error(`Unknown editor project action: ${id}`);
  return action;
}

export function getEditorViewAction(id: EditorViewActionId): Omit<EditorActionDef, 'surfaces' | 'primaryOnCoarse'> {
  const action = EDITOR_VIEW_ACTIONS.find((entry) => entry.id === id);
  if (!action) throw new Error(`Unknown editor view action: ${id}`);
  return action;
}
