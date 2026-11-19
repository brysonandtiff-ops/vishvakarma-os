import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewProjectDialog from '@/components/editor/NewProjectDialog';
import { createProjectManifest } from '@/core/projectModel';
import { getLocalProjects, LOCAL_PROJECTS_KEY } from '@/editor/localProjects';
import type { ProjectManifest } from '@/types';

const { backendStatus, createProject } = vi.hoisted(() => ({
  backendStatus: { isConfigured: false },
  createProject: vi.fn(),
}));

vi.mock('@/backend/backendConfig', () => ({ backendStatus }));
vi.mock('@/db/api', () => ({ createProject }));

const sourcePlan: ProjectManifest = {
  ...createProjectManifest({
    name: 'Untitled Project',
    description: 'Imported plan notes',
    walls: [{ id: 'source-wall', start: { x: 50, y: 30 }, end: { x: 300, y: 30 }, thickness: 15, height: 280, material: 'material-concrete' }],
    openings: [{ id: 'source-door', wallId: 'source-wall', type: 'door', position: 0.45, width: 85, height: 210 }],
    gridSize: 35,
    snapToGrid: false,
  }),
  labels: [{ id: 'source-label', text: 'Entrance', position: { x: 100, y: 100 }, fontSize: 14 }],
};

describe('Save a working plan as a named project', () => {
  beforeEach(() => {
    backendStatus.isConfigured = false;
    createProject.mockReset();
    localStorage.removeItem(LOCAL_PROJECTS_KEY);
  });

  it('saves the original geometry and settings under the entered project details', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<NewProjectDialog open sourceManifest={sourcePlan} onProjectCreated={onCreated} onOpenChange={onClose} onOpenAIDesigner={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Save Plan as Project' });
    expect(dialog).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Blank' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start with Architecture Copilot' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Project Name' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Imported plan notes');

    fireEvent.change(screen.getByRole('textbox', { name: 'Project Name' }), { target: { value: '  Riverside house  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Project' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const [project] = getLocalProjects();
    expect(project.name).toBe('Riverside house');
    expect(project.manifest).toEqual({ ...sourcePlan, name: 'Riverside house' });
    expect(onCreated).toHaveBeenCalledWith(project);
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('keeps the dialog and the input open on a local storage failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onCreated = vi.fn();
    const onClose = vi.fn();
    const existingIndex = '{unreadable plans';
    localStorage.setItem(LOCAL_PROJECTS_KEY, existingIndex);

    try {
      render(<NewProjectDialog open sourceManifest={sourcePlan} onProjectCreated={onCreated} onOpenChange={onClose} />);
      fireEvent.change(screen.getByRole('textbox', { name: 'Project Name' }), { target: { value: 'Working copy' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Project' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Local project data could not be read.');
      expect(screen.getByRole('textbox', { name: 'Project Name' })).toHaveValue('Working copy');
      expect(screen.getByRole('button', { name: 'Save Project' })).toBeEnabled();
      expect(localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(existingIndex);
      expect(onCreated).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('passes the existing manifest to the configured project service', async () => {
    backendStatus.isConfigured = true;
    const onCreated = vi.fn();
    const namedPlan = { ...sourcePlan, name: 'Imported Rivers' };
    const serverProject = { id: 'cloud-id', manifest: namedPlan };
    createProject.mockResolvedValue(serverProject);

    render(<NewProjectDialog open sourceManifest={namedPlan} onProjectCreated={onCreated} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Project' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(serverProject));
    expect(createProject).toHaveBeenCalledWith(namedPlan.name, namedPlan.description, namedPlan);
    expect(getLocalProjects()).toEqual([]);
  });

  it('still creates a blank plan through the ordinary project dialog', async () => {
    const onCreated = vi.fn();
    render(<NewProjectDialog open onProjectCreated={onCreated} onOpenChange={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Create New Project' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Blank' })).toBeVisible();

    fireEvent.change(screen.getByRole('textbox', { name: 'Project Name' }), { target: { value: 'New workspace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
    expect(getLocalProjects()[0]).toMatchObject({ name: 'New workspace', manifest: { walls: [], openings: [] } });
  });
});
