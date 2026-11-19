import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useMemo, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditorSidebarSections from '@/components/editor/EditorSidebarSections';
import type { EditorSidebarConfig } from '@/components/editor/EditorSidebarContext';
import {
  EditorSidebarProvider,
  useRegisterEditorSidebar,
} from '@/components/editor/EditorSidebarContext';
import AppLayout from '@/components/layouts/AppLayout';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    profile: { full_name: 'Test User' },
    mode: 'local',
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBilling', () => ({
  useBilling: () => ({ plan: 'Free' }),
}));

function makeConfig(overrides: Partial<EditorSidebarConfig> = {}): EditorSidebarConfig {
  return {
    onNewProject: vi.fn(),
    onOpenProject: vi.fn(),
    onSave: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onLoadSample: vi.fn(),
    onAIDesigner: vi.fn(),
    onToggle3D: vi.fn(),
    onToggleGrid: vi.fn(),
    show3DView: false,
    gridVisible: true,
    ...overrides,
  };
}

function SidebarRegistrationProbe({ config }: { config: EditorSidebarConfig }) {
  useRegisterEditorSidebar(config);
  return null;
}

function renderAppLayoutAt(path: string, editorConfig?: EditorSidebarConfig | null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <AppLayout immersive={path === '/editor'}>
              {editorConfig && <SidebarRegistrationProbe config={editorConfig} />}
              <div data-testid="page-content">Page</div>
            </AppLayout>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EditorSidebarSections', () => {
  it('renders project actions and view controls', () => {
    render(
      <MemoryRouter>
        <EditorSidebarProvider>
          <EditorSidebarSections config={makeConfig()} />
        </EditorSidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('editor-sidebar-project-actions')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-view')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-new-project')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-open-project')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-save')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-import')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-export')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-load-sample')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-ai-copilot')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-toggle-3d')).toBeInTheDocument();
    expect(screen.getByTestId('editor-sidebar-toggle-grid')).toBeInTheDocument();
  });

  it('uses dynamic view labels based on toggle state', () => {
    render(
      <MemoryRouter>
        <EditorSidebarProvider>
          <EditorSidebarSections config={makeConfig({ show3DView: true, gridVisible: false })} />
        </EditorSidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Hide 3D view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show grid' })).toBeInTheDocument();
  });

  it('calls Architecture Copilot and view toggle handlers', async () => {
    const user = userEvent.setup();
    const config = makeConfig();

    render(
      <MemoryRouter>
        <EditorSidebarProvider>
          <EditorSidebarSections config={config} onAfterAction={vi.fn()} />
        </EditorSidebarProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('editor-sidebar-ai-copilot'));
    await user.click(screen.getByTestId('editor-sidebar-toggle-3d'));
    await user.click(screen.getByTestId('editor-sidebar-toggle-grid'));

    expect(config.onAIDesigner).toHaveBeenCalledTimes(1);
    expect(config.onToggle3D).toHaveBeenCalledTimes(1);
    expect(config.onToggleGrid).toHaveBeenCalledTimes(1);
  });

  it('calls onAfterAction after each sidebar action', async () => {
    const user = userEvent.setup();
    const onAfterAction = vi.fn();
    const config = makeConfig();

    render(
      <MemoryRouter>
        <EditorSidebarProvider>
          <EditorSidebarSections config={config} onAfterAction={onAfterAction} />
        </EditorSidebarProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('editor-sidebar-new-project'));
    expect(onAfterAction).toHaveBeenCalledTimes(1);
  });
});

describe('AppLayout editor sidebar integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace navigation on non-editor routes without project actions', () => {
    renderAppLayoutAt('/projects');

    expect(screen.getByRole('link', { name: 'Studio', hidden: true })).toHaveAttribute('href', '/editor');
    expect(screen.getByRole('link', { name: 'Projects', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: '3D Room', hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByTestId('editor-sidebar-project-actions')).not.toBeInTheDocument();
  });

  it('opens a named workspace menu with design and governance destinations', async () => {
    const user = userEvent.setup();
    renderAppLayoutAt('/projects');

    await user.click(screen.getByRole('button', { name: 'Open workspace navigation' }));

    const menu = within(screen.getByRole('dialog', { name: 'Workspace' }));
    expect(menu.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(menu.getByRole('link', { name: '3D Room' })).toHaveAttribute('href', '/3d-room');
    expect(menu.getByRole('link', { name: 'Release Center' })).toHaveAttribute('href', '/releases');
  });

  it('offers Profile and Sign out through the account menu', async () => {
    const user = userEvent.setup();
    renderAppLayoutAt('/projects');

    await user.click(screen.getByRole('button', { name: 'Account menu for Test User' }));

    const menu = within(screen.getByRole('menu'));
    expect(menu.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('does not show project actions on editor route before config registration', () => {
    renderAppLayoutAt('/editor');

    expect(screen.getByRole('link', { name: 'Studio', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('editor-sidebar-project-actions')).not.toBeInTheDocument();
  });

  it('shows project actions on editor route when config is registered', async () => {
    renderAppLayoutAt('/editor', makeConfig());

    await waitFor(() => {
      expect(screen.getByTestId('editor-sidebar-project-actions')).toBeInTheDocument();
    });
    expect(screen.getByTestId('editor-sidebar-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Architecture Copilot' })).toBeInTheDocument();
  });

  it('opens Architecture Copilot dialog via registered sidebar callback', async () => {
    const user = userEvent.setup();

    function CopilotProbe() {
      const [copilotOpen, setCopilotOpen] = useState(false);
      useRegisterEditorSidebar(
        useMemo(
          () =>
            makeConfig({
              onAIDesigner: () => setCopilotOpen(true),
            }),
          [],
        ),
      );
      return copilotOpen ? <div data-testid="ai-dialog-open">AI dialog open</div> : null;
    }

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route
            path="/editor"
            element={
              <AppLayout immersive>
                <CopilotProbe />
              </AppLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('editor-sidebar-ai-copilot'));
    await waitFor(() => {
      expect(screen.getByTestId('ai-dialog-open')).toBeInTheDocument();
    });
  });
});

describe('Studio navigation wiring', () => {
  it('opens the shared workspace menu from the Studio page', () => {
    const editor = read('src/pages/EditorPage.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');

    expect(editor).not.toContain('<EditorMenuSheet');
    expect(editor).not.toContain('editorMenuOpen');
    expect(editor).toContain('useGovernanceNav()');
    expect(editor).toContain('onOpenGovernance={openNav}');
    expect(appLayout).toContain('All workspace destinations');
  });

  it('offers workspace navigation in the shared bar and Studio tools', () => {
    const topBar = read('src/components/editor/EditorTopBar.tsx');
    const appLayout = read('src/components/layouts/AppLayout.tsx');
    expect(topBar).toContain('onSelect={onOpenGovernance}');
    expect(appLayout).toContain('Open workspace navigation');
  });
});
