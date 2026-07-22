import { useState } from 'react';
import { Copy, Radio, Square } from 'lucide-react';
import { toast } from 'sonner';
import { canStartCast, canUseCastChrono, canUseCastLenses, castMaxViewers } from '@/cast/castTier';
import { useCastSession } from '@/cast/useCastSession';
import { usePlanTier } from '@/hooks/usePlanTier';
import type { ProjectManifest } from '@/types';
import CastIntentTimeline from '@/components/cast/CastIntentTimeline';
import { Button } from '@/components/ui/button';

const PANEL_CARD =
  'rounded-xl border border-primary/20 bg-black/20 px-4 py-3 text-xs text-ws-text-dim shadow-sm';

const LENS_OPTIONS = [
  { key: 'thermal' as const, label: 'Thermal' },
  { key: 'vayu' as const, label: 'Vayu CFD' },
  { key: 'vastu' as const, label: 'Vastu' },
  { key: 'mep' as const, label: 'MEP' },
  { key: 'compliance' as const, label: 'Compliance' },
  { key: 'panchatattva' as const, label: 'Panchatattva' },
];

interface AkashaCastPanelProps {
  projectId?: string;
  userId?: string;
  userName: string;
  manifest: ProjectManifest;
  onCastStart?: () => void;
  onCastStop?: () => void;
  onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
}

export default function AkashaCastPanel({
  projectId,
  userId,
  userName,
  manifest,
  onCastStart,
  onCastStop,
  onManifestChange,
}: AkashaCastPanelProps) {
  const planTier = usePlanTier();
  const {
    live,
    shareUrl,
    viewerCount,
    lenses,
    chrono,
    intents,
    intentRelayEnabled,
    startCast,
    stopCast,
    setLenses,
    setChrono,
    setIntentRelayEnabled,
  } = useCastSession();
  const [busy, setBusy] = useState(false);

  const canCast = canStartCast(planTier);
  const maxViewers = castMaxViewers(planTier);
  const lensesAllowed = canUseCastLenses(planTier);
  const chronoAllowed = canUseCastChrono(planTier);

  const handleStart = async () => {
    if (!projectId || !userId) {
      toast.error('Save project to cloud before starting Akasha Cast');
      return;
    }
    setBusy(true);
    try {
      await startCast({
        projectId,
        userId,
        userName,
        manifest,
        onManifestChange,
      });
      onCastStart?.();
      toast.success('Akasha Cast is live');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start cast');
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    setBusy(true);
    try {
      await stopCast();
      onCastStop?.();
      toast.message('Cast ended');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Cast link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (!canCast) {
    return (
      <div className={`${PANEL_CARD} vish-coming-soon-panel`} data-testid="akasha-cast-panel">
        <p className="font-bold uppercase tracking-[0.14em] text-primary">Akasha Cast</p>
        <p className="mt-1 text-ws-text-dim">Semantic lens broadcasting — Studio plan required.</p>
      </div>
    );
  }

  return (
    <div className={`${PANEL_CARD} space-y-3`} data-testid="akasha-cast-panel">
      <div>
        <p className="font-bold uppercase tracking-[0.14em] text-primary">Akasha Cast</p>
        <p className="mt-1 text-ws-text-dim">Share the building, not the screen — manifest + lens sync.</p>
      </div>

      {!live ? (
        <Button
          type="button"
          size="sm"
          className="w-full touch-target"
          disabled={busy || !projectId}
          onClick={() => void handleStart()}
          data-testid="akasha-cast-start"
        >
          <Radio className="mr-2 h-4 w-4" />
          Start cast
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-success">
            <span>Live</span>
            <span data-testid="akasha-cast-viewer-count">
              {viewerCount}/{maxViewers === 999 ? '∞' : maxViewers} viewers
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="w-full touch-target"
            disabled={busy}
            onClick={() => void handleStop()}
            data-testid="akasha-cast-stop"
          >
            <Square className="mr-2 h-4 w-4" />
            End cast
          </Button>
          {shareUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full touch-target"
              onClick={() => void copyLink()}
              data-testid="akasha-cast-copy-link"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy viewer link
            </Button>
          )}
        </div>
      )}

      {live && lensesAllowed && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Lens deck</p>
          <div className="flex flex-wrap gap-1">
            {LENS_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  lenses[option.key]
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-ws-border text-ws-text-dim'
                }`}
                onClick={() => setLenses({ [option.key]: !lenses[option.key] })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {live && chronoAllowed && (
        <label className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide">
          <span>Chrono lock (solar sync)</span>
          <input
            type="checkbox"
            checked={chrono.locked}
            onChange={(event) => setChrono({ locked: event.target.checked, lighting: { ...manifest.lighting } })}
            className="h-4 w-4"
            data-testid="akasha-cast-chrono-lock"
          />
        </label>
      )}

      {live && (
        <label className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide">
          <span>Intent relay</span>
          <input
            type="checkbox"
            checked={intentRelayEnabled}
            onChange={(event) => setIntentRelayEnabled(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      )}

      {live && intentRelayEnabled && <CastIntentTimeline intents={intents} />}
    </div>
  );
}
