import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AkashaCastPanel from '@/components/editor/panels/AkashaCastPanel';
import { useCastSession } from '@/cast/useCastSession';
import { usePlanTier } from '@/hooks/usePlanTier';
import type { ProjectManifest } from '@/types';

vi.mock('@/cast/useCastSession', () => ({ useCastSession: vi.fn() }));
vi.mock('@/hooks/usePlanTier', () => ({ usePlanTier: vi.fn() }));
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

const mockedUseCastSession = vi.mocked(useCastSession);
const mockedUsePlanTier = vi.mocked(usePlanTier);

function castState(live: boolean, stopCast = vi.fn().mockResolvedValue(undefined)) {
  return {
    manager: {},
    live,
    shareUrl: live ? 'https://example.test/cast/recovery' : null,
    viewerCount: live ? 2 : 0,
    lenses: {
      thermal: false,
      vayu: false,
      vastu: false,
      mep: false,
      compliance: false,
      panchatattva: false,
    },
    chrono: {
      locked: false,
      lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
    },
    intents: [],
    intentRelayEnabled: false,
    role: 'presenter',
    startCast: vi.fn(),
    stopCast,
    setLenses: vi.fn(),
    setChrono: vi.fn(),
    setIntentRelayEnabled: vi.fn(),
    updatePresenterLighting: vi.fn(),
    updatePresenterViewport: vi.fn(),
  } as unknown as ReturnType<typeof useCastSession>;
}

const manifest = {
  lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
} as ProjectManifest;

describe('Akasha Cast recovery controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePlanTier.mockReturnValue('studio');
  });

  it('keeps a touch-safe End cast control visible while presentation lock is active', async () => {
    const user = userEvent.setup();
    const stopCast = vi.fn().mockResolvedValue(undefined);
    const onCastStop = vi.fn();
    mockedUseCastSession.mockReturnValue(castState(true, stopCast));

    render(
      <AkashaCastPanel
        userName="Architect"
        manifest={manifest}
        presentationControlsOnly
        onCastStop={onCastStop}
      />,
    );

    expect(screen.getByTestId('akasha-cast-presentation-controls')).toBeInTheDocument();
    expect(screen.getByText('Cast live')).toBeInTheDocument();
    expect(screen.getByTestId('akasha-cast-presentation-viewer-count')).toHaveTextContent('2/3');

    const stop = screen.getByRole('button', { name: /end cast/i });
    expect(stop.className).toContain('min-h-[44px]');
    expect(stop.className).toContain('min-w-[44px]');

    await user.click(stop);

    expect(stopCast).toHaveBeenCalledTimes(1);
    expect(onCastStop).toHaveBeenCalledTimes(1);
  });

  it('keeps the viewer link copyable when the panel switches to presentation controls', async () => {
    const user = userEvent.setup();
    mockedUseCastSession.mockReturnValue(castState(true));

    const { rerender } = render(
      <AkashaCastPanel userName="Architect" manifest={manifest} />,
    );

    expect(screen.getByRole('button', { name: /copy viewer link/i })).toBeVisible();

    rerender(
      <AkashaCastPanel
        userName="Architect"
        manifest={manifest}
        presentationControlsOnly
      />,
    );

    const copy = screen.getByRole('button', { name: /copy viewer link/i });
    expect(copy.className).toContain('min-h-[44px]');
    expect(copy.className).toContain('min-w-[44px]');

    await user.click(copy);

    expect(await navigator.clipboard.readText()).toBe('https://example.test/cast/recovery');
  });

  it('does not offer to copy a missing viewer link in presentation controls', () => {
    mockedUseCastSession.mockReturnValue({ ...castState(true), shareUrl: null });

    render(
      <AkashaCastPanel
        userName="Architect"
        manifest={manifest}
        presentationControlsOnly
      />,
    );

    expect(screen.queryByRole('button', { name: /copy viewer link/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end cast/i })).toBeVisible();
  });

  it('keeps live recovery controls available while start entitlement is unavailable', async () => {
    const user = userEvent.setup();
    const stopCast = vi.fn().mockResolvedValue(undefined);
    mockedUseCastSession.mockReturnValue(castState(true, stopCast));
    mockedUsePlanTier.mockReturnValue('starter');

    const { rerender } = render(
      <AkashaCastPanel
        userName="Architect"
        manifest={manifest}
        presentationControlsOnly
      />,
    );

    await user.click(screen.getByRole('button', { name: /copy viewer link/i }));
    expect(await navigator.clipboard.readText()).toBe('https://example.test/cast/recovery');

    rerender(<AkashaCastPanel userName="Architect" manifest={manifest} />);
    expect(screen.getByRole('button', { name: /copy viewer link/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /start cast/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /end cast/i }));
    expect(stopCast).toHaveBeenCalledTimes(1);
  });

  it('does not show presentation controls when no cast is live', () => {
    mockedUseCastSession.mockReturnValue(castState(false));

    render(
      <AkashaCastPanel
        userName="Architect"
        manifest={manifest}
        presentationControlsOnly
      />,
    );

    expect(screen.queryByTestId('akasha-cast-presentation-controls')).not.toBeInTheDocument();
  });
});
