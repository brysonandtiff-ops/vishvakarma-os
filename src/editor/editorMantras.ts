import type { WorkspaceMode } from '@/types';

export const WORKSPACE_MODE_MANTRAS: Record<WorkspaceMode, string> = {
  draft: 'शिल्प · Draft',
  mep: 'वायु · MEP',
  interior: 'आभा · Interior',
  landscape: 'पृथ्वी · Landscape',
  walk: 'प्रवेश · Walk',
};

export function resolveEditorMantraChip(workspaceMode: WorkspaceMode): string {
  return WORKSPACE_MODE_MANTRAS[workspaceMode] ?? WORKSPACE_MODE_MANTRAS.draft;
}

export const ORBIT_MODE_MANTRA = 'दर्शन · Orbit';
