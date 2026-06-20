import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTutorial } from './TutorialProvider';
import { getGateHint, isGateSatisfied } from './tutorialGuards';
import type { TutorialPlacement } from './types';
import '@/styles/vish-tutorial.css';

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PADDING_DEFAULT = 12;

const TARGET_FALLBACK_SELECTORS: Record<string, string> = {
  'command-palette': 'button[aria-label="Open command palette"]',
  'mobile-navigation': 'button[aria-label="Open navigation"]',
  'nav-editor': 'a[href="/editor"]',
  'nav-projects': 'a[href="/projects"]',
  'nav-optimization': 'a[href="/optimization"]',
  'nav-profile': 'a[href="/profile"]',
  'nav-spec-center': 'a[href="/spec-center"]',
  'nav-registry': 'a[href="/registry"]',
  'nav-change-requests': 'a[href="/change-requests"]',
  'nav-releases': 'a[href="/releases"]',
  'nav-world-records': 'a[href="/world-records"]',
  'nav-audit': 'a[href="/audit"]',
};

function findTutorialTarget(targetId: string): HTMLElement | null {
  const direct = document.querySelector<HTMLElement>(`[data-tutorial="${targetId}"]`);
  if (direct) return direct;

  const fallbackSelector = TARGET_FALLBACK_SELECTORS[targetId];
  return fallbackSelector ? document.querySelector<HTMLElement>(fallbackSelector) : null;
}

function measureTarget(el: HTMLElement, padding: number): Rect {
  const rect = el.getBoundingClientRect();
  return {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function tooltipPosition(
  placement: TutorialPlacement,
  targetRect: Rect | null,
  cardWidth: number,
  cardHeight: number
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 16;

  if (!targetRect || placement === 'center') {
    return {
      top: Math.max(margin, (vh - cardHeight) / 2),
      left: Math.max(margin, (vw - cardWidth) / 2),
    };
  }

  switch (placement) {
    case 'right':
      return {
        top: Math.min(vh - cardHeight - margin, Math.max(margin, targetRect.top)),
        left: Math.min(vw - cardWidth - margin, targetRect.left + targetRect.width + margin),
      };
    case 'left':
      return {
        top: Math.min(vh - cardHeight - margin, Math.max(margin, targetRect.top)),
        left: Math.max(margin, targetRect.left - cardWidth - margin),
      };
    case 'bottom':
      return {
        top: Math.min(vh - cardHeight - margin, targetRect.top + targetRect.height + margin),
        left: Math.min(vw - cardWidth - margin, Math.max(margin, targetRect.left + targetRect.width / 2 - cardWidth / 2)),
      };
    case 'top':
    default:
      return {
        top: Math.max(margin, targetRect.top - cardHeight - margin),
        left: Math.min(vw - cardWidth - margin, Math.max(margin, targetRect.left + targetRect.width / 2 - cardWidth / 2)),
      };
  }
}

export default function TutorialEngine() {
  const {
    activeTrack,
    stepIndex,
    paused,
    editorSnapshot,
    advance,
    back,
    skipTrack,
    setPaused,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [cardSize, setCardSize] = useState({ width: 320, height: 200 });
  const reducedMotion = useReducedMotion();

  const step = activeTrack?.steps[stepIndex];
  const totalSteps = activeTrack?.steps.length ?? 0;
  const isLastStep = stepIndex >= totalSteps - 1;

  const remeasure = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      setTargetMissing(false);
      return;
    }
    const el = findTutorialTarget(step.target);
    if (!el) {
      setTargetRect(null);
      setTargetMissing(true);
      return;
    }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    setTargetMissing(false);
    setTargetRect(measureTarget(el, step.spotlightPadding ?? PADDING_DEFAULT));
  }, [reducedMotion, step]);

  useLayoutEffect(() => {
    if (!activeTrack || paused || !step) {
      setTargetRect(null);
      return;
    }

    remeasure();
    const delays = [100, 300, 600, 1200, 2000];
    const timers = delays.map((ms) => window.setTimeout(remeasure, ms));

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(remeasure) : null;
    const el = step.target ? findTutorialTarget(step.target) : null;
    if (el && ro) ro.observe(el);

    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      ro?.disconnect();
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [activeTrack, paused, remeasure, step]);

  useEffect(() => {
    if (!activeTrack || !step) return;
    const blockingDialog = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
    const isExportStep = step.target === 'export-dialog' || editorSnapshot.exportDialogOpen;
    const shouldPause = Boolean(blockingDialog && !isExportStep);
    setPaused(shouldPause);
  }, [activeTrack, editorSnapshot.exportDialogOpen, setPaused, step]);

  if (!activeTrack || !step || paused) return null;

  const placement = targetMissing ? 'center' : (step.placement ?? (step.target ? 'bottom' : 'center'));
  const gateReady = step.gate ? isGateSatisfied(step.gate, editorSnapshot) : true;
  const gateHint = step.gate ? getGateHint(step.gate, step.gateHint) : undefined;
  const tooltipPos = tooltipPosition(placement, targetRect, cardSize.width, cardSize.height);

  const cardRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    const { width, height } = node.getBoundingClientRect();
    if (width !== cardSize.width || height !== cardSize.height) {
      setCardSize({ width, height });
    }
  };

  return createPortal(
    <div className="vish-tutorial-root" data-testid="tutorial-overlay" role="presentation">
      {targetRect && !targetMissing ? (
        <>
          <div className="vish-tutorial-scrim vish-tutorial-scrim--top" style={{ height: targetRect.top }} />
          <div
            className="vish-tutorial-scrim vish-tutorial-scrim--left"
            style={{ top: targetRect.top, height: targetRect.height, width: targetRect.left }}
          />
          <div
            className="vish-tutorial-scrim vish-tutorial-scrim--right"
            style={{
              top: targetRect.top,
              height: targetRect.height,
              left: targetRect.left + targetRect.width,
              right: 0,
            }}
          />
          <div
            className="vish-tutorial-scrim vish-tutorial-scrim--bottom"
            style={{ top: targetRect.top + targetRect.height }}
          />
          <div
            className={`vish-tutorial-spotlight ${reducedMotion ? '' : 'vish-tutorial-spotlight--pulse'}`}
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="vish-tutorial-scrim vish-tutorial-scrim--full" />
      )}

      <div
        ref={cardRef}
        className="vish-tutorial-card vish-glass-panel vish-glass-panel--interactive"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-labelledby="tutorial-step-title"
        aria-describedby="tutorial-step-body"
        data-testid="tutorial-card"
      >
        <div className="vish-tutorial-card__header">
          <div className="min-w-0">
            <p className="vish-tutorial-card__track">{activeTrack.title}</p>
            <p className="vish-tutorial-card__progress" aria-live="polite">
              Step {stepIndex + 1} of {totalSteps}
            </p>
          </div>
          <button
            type="button"
            className="vish-tutorial-card__close touch-target"
            aria-label="Skip tutorial"
            onClick={skipTrack}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 id="tutorial-step-title" className="vish-tutorial-card__title">
          {step.title}
        </h3>
        <p id="tutorial-step-body" className="vish-tutorial-card__body">
          {targetMissing && step.target
            ? `${step.body} If you cannot see the highlighted control, open the editor menu or expand the sidebar.`
            : step.body}
        </p>
        {step.optionalAction && (
          <p className="vish-tutorial-card__hint">{step.optionalAction}</p>
        )}

        <div className="vish-tutorial-card__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            disabled={stepIndex === 0}
            onClick={back}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            variant={gateReady ? 'gold' : 'outline'}
            size="sm"
            className="min-h-[44px] flex-1"
            disabled={!gateReady}
            onClick={advance}
            data-testid="tutorial-continue"
          >
            {gateReady ? (
              <>
                {isLastStep ? 'Finish' : 'Continue'}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </>
            ) : (
              gateHint
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
