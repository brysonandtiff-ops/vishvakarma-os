import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getLiteEditorManifest } from '@/editor/liteEditorHandoff';
import { LOCAL_DRAFT_KEY } from '@/editor/localDraft';
import LiteEditorPage from '@/pages/LiteEditorPage';

vi.mock('@/components/editor/Viewport3D', () => ({ default: () => null }));

function RoomHandoff() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const manifest = getLiteEditorManifest(state);
  return (
    <>
      <output aria-label="Room geometry">{JSON.stringify(manifest)}</output>
      <Link to="/editor-lite" state={state}>Back to 2D</Link>
      <button type="button" onClick={() => void navigate(-1)}>Browser back</button>
    </>
  );
}

function renderEditor() {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/editor-lite']}>
        <Routes>
          <Route path="/editor-lite" element={<LiteEditorPage />} />
          <Route path="/3d-room" element={<RoomHandoff />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('Lite Editor 3D Room handoff', () => {
  it('opens the exact edited plan and lets the user return without replacing a recovery draft', async () => {
    localStorage.setItem(LOCAL_DRAFT_KEY, 'a draft belonging to the full editor');
    try {
      renderEditor();
      expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
      fireEvent.click(screen.getByRole('button', { name: 'Snap On' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      const canvas = screen.getByTestId('lite-blueprint-canvas');
      Object.defineProperty(canvas, 'setPointerCapture', { value: vi.fn() });
      fireEvent.pointerDown(canvas, { pointerId: 1, isPrimary: true, clientX: 162, clientY: 152 });
      fireEvent.pointerMove(canvas, { pointerId: 1, isPrimary: true, clientX: 326, clientY: 152 });
      fireEvent.pointerUp(canvas, { pointerId: 1, isPrimary: true, clientX: 326, clientY: 152 });

      fireEvent.click(screen.getByRole('button', { name: 'Open 3D Room' }));
      const geometry = await screen.findByLabelText('Room geometry');
      expect(JSON.parse(geometry.textContent ?? '')).toMatchObject({
        walls: [{ start: { x: 100, y: 100 }, end: { x: 300, y: 100 } }],
        openings: [],
        rooms: [],
        snapToGrid: false,
      });
      expect(localStorage.getItem(LOCAL_DRAFT_KEY)).toBe('a draft belonging to the full editor');

      fireEvent.click(screen.getByRole('link', { name: 'Back to 2D' }));
      expect(await screen.findByText('1 walls · 0 openings · 0 rooms')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Snap Off' })).toBeVisible();
    } finally {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    }
  });

  it('restores a cleared plan through browser Back instead of replacing it with the starter plan', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open 3D Room' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Browser back' }));
    expect(await screen.findByText('0 walls · 0 openings · 0 rooms')).toBeVisible();
  });

  it('leaves wall geometry unchanged if touch input cancels a stroke', () => {
    renderEditor();
    const canvas = screen.getByTestId('lite-blueprint-canvas');
    Object.defineProperty(canvas, 'setPointerCapture', { value: vi.fn() });
    fireEvent.pointerDown(canvas, { pointerId: 1, isPrimary: true, clientX: 162, clientY: 152 });
    fireEvent.pointerMove(canvas, { pointerId: 1, isPrimary: true, clientX: 326, clientY: 152 });
    fireEvent.pointerCancel(canvas, { pointerId: 1, isPrimary: true, clientX: 326, clientY: 152 });

    expect(screen.getByText('5 walls · 2 openings · 2 rooms')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });
});
