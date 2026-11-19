import type { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectManifest } from '@/core/projectModel';
import { getLiteEditorManifest } from '@/editor/liteEditorHandoff';
import ThreeDRoomPage from '@/pages/ThreeDRoomPage';
import type { ProjectManifest } from '@/types';

const { loadSample, readDraft } = vi.hoisted(() => ({
  loadSample: vi.fn<(sampleId: string) => Promise<ProjectManifest>>(),
  readDraft: vi.fn(),
}));

vi.mock('@/components/layouts/AppLayout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/hooks/useCoarsePointer', () => ({ useCoarsePointer: () => false }));
vi.mock('@/editor/localDraft', () => ({ readLocalDraft: readDraft }));
vi.mock('@/core/sampleCatalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/core/sampleCatalog')>()),
  loadSampleById: loadSample,
}));
vi.mock('@/components/editor/Viewport3D', () => ({
  default: ({ walkMode, walls }: { walkMode: boolean; walls: ProjectManifest['walls'] }) => (
    <div data-testid="scene-engine" data-mode={walkMode ? 'walk' : 'orbit'} data-wall-count={walls.length} />
  ),
}));

function ActiveLocation() {
  const location = useLocation();
  return <div data-testid="room-location">{location.pathname}{location.search}</div>;
}

function LiteEditorProbe() {
  const location = useLocation();
  return <p>Restored {getLiteEditorManifest(location.state)?.name}</p>;
}

function renderRoom(search = '', state?: unknown) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[{ pathname: '/3d-room', search, state }]}>
        <Routes>
          <Route path="/3d-room" element={<ThreeDRoomPage />} />
          <Route path="/editor-lite" element={<LiteEditorProbe />} />
        </Routes>
        <ActiveLocation />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const manifest = (name: string) => createProjectManifest({ name, walls: [], openings: [] });

function deferred<T>() {
  let resolve!: (result: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  readDraft.mockReset();
  readDraft.mockReturnValue(null);
  loadSample.mockReset();
  loadSample.mockImplementation(async (sampleId) => manifest(sampleId));
});

describe('3D Room workflow', () => {
  it('honors the Walk URL and keeps the selected scene when returning to Orbit', async () => {
    renderRoom('?mode=walk&sample=five-three-sky-court');
    expect(await screen.findByTestId('scene-engine')).toHaveAttribute('data-mode', 'walk');
    expect(screen.getByRole('button', { name: 'Walk mode' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Orbit' }));
    expect(screen.getByTestId('scene-engine')).toHaveAttribute('data-mode', 'orbit');
    expect(screen.getByTestId('room-location')).toHaveTextContent('/3d-room?sample=five-three-sky-court');
    expect(loadSample).toHaveBeenCalledTimes(1);
  });

  it('previews the current Lite plan and preserves it when browsing samples and returning to the editor', async () => {
    renderRoom('', { liteEditorManifest: manifest('Family sketch') });
    expect(await screen.findByRole('heading', { name: 'Family sketch' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Scene' })).toHaveValue('lite');
    expect(readDraft).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('combobox', { name: 'Scene' }), { target: { value: 'five-three-sky-court' } });
    expect(await screen.findByRole('heading', { name: 'five-three-sky-court' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to 2D plan' }));
    expect(screen.getByText('Restored Family sketch')).toBeInTheDocument();
  });

  it('does not overwrite a newer scene when an older request finishes late', async () => {
    const slow = deferred<ProjectManifest>();
    loadSample.mockImplementationOnce(() => slow.promise);
    renderRoom();

    fireEvent.change(screen.getByRole('combobox', { name: 'Scene' }), { target: { value: 'full-feature-showcase' } });
    expect(await screen.findByRole('heading', { name: 'full-feature-showcase' })).toBeInTheDocument();
    await act(async () => slow.resolve(manifest('Outdated scene')));
    expect(screen.queryByRole('heading', { name: 'Outdated scene' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Scene' })).toHaveValue('full-feature-showcase');
  });

  it('keeps the requested sample identity and offers retry when loading fails', async () => {
    loadSample.mockRejectedValueOnce(new Error('Unavailable'));
    renderRoom('?sample=dual-key-3242-courtyard');
    const preview = within(screen.getByTestId('room-viewport'));
    expect(await preview.findByRole('heading', { name: 'Couldn’t open this scene' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Scene' })).toHaveValue('dual-key-3242-courtyard');
    fireEvent.click(preview.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'dual-key-3242-courtyard' })).toBeInTheDocument();
    expect(loadSample).toHaveBeenNthCalledWith(2, 'dual-key-3242-courtyard');
  });

  it('distinguishes no local editor draft from a sample scene', async () => {
    renderRoom('?source=draft');
    expect(await screen.findByRole('heading', { name: 'No local editor draft yet' })).toBeInTheDocument();
    expect(loadSample).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load a sample' }));
    expect(await screen.findByRole('heading', { name: 'six-three-atrium-wing' })).toBeInTheDocument();
  });
});
