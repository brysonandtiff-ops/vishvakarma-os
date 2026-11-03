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
