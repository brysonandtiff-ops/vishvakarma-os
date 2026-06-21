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
    setTargetRect(measureTarget(el, step.padding ?? PADDING_DEFAULT));
  }, [step, reducedMotion]);

  useLayoutEffect(() => {
    if (!activeTrack || paused) return;
    remeasure();
  }, [activeTrack, paused, stepIndex, remeasure]);

  useEffect(() => {
    if (!activeTrack || paused) return;
    const onResize = () => remeasure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const id = window.setInterval(remeasure, 750);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      window.clearInterval(id);
    };
  }, [activeTrack, paused, remeasure]);

  if (!activeTrack || paused || !step) return null;

  const gateOk = !step.gate || isGateSatisfied(step.gate, editorSnapshot);
  const gateHint = step.gate ? getGateHint(step.gate) : null;
  const pos = tooltipPosition(step.placement ?? 'right', targetRect, cardSize.width, cardSize.height);

  return createPortal(
    <div className="vish-tutorial-layer" role="dialog" aria-modal="true" aria-label={`${activeTrack.title} tutorial`}>
      {targetRect && (
        <div
          className="vish-tutorial-spotlight"
          style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }}
        />
      )}
      <div className="vish-tutorial-scrim" />
      <div
        className="vish-tutorial-card"
        style={{ top: pos.top, left: pos.left }}
        ref={(node) => {
          if (node) {
            const rect = node.getBoundingClientRect();
            if (Math.abs(rect.width - cardSize.width) > 1 || Math.abs(rect.height - cardSize.height) > 1) {
              setCardSize({ width: rect.width, height: rect.height });
            }
          }
        }}
      >
        <div className="vish-tutorial-card__topline">
          <span>{activeTrack.title}</span>
          <button type="button" onClick={skipTrack} aria-label="Close tutorial">
            <X size={16} />
          </button>
        </div>
        <div className="vish-tutorial-card__progress" aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}>
          <span style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        {targetMissing && <p className="vish-tutorial-card__hint">Control not visible yet. Open the related panel or continue.</p>}
        {!gateOk && gateHint && <p className="vish-tutorial-card__hint">{gateHint}</p>}
        <div className="vish-tutorial-card__actions">
          <Button variant="ghost" size="sm" onClick={back} disabled={stepIndex === 0}>
            <ChevronLeft size={16} /> Back
          </Button>
          <Button size="sm" onClick={advance} disabled={!gateOk}>
            {isLastStep ? 'Finish' : 'Next'} <ChevronRight size={16} />
          </Button>
        </div>
        <button type="button" className="vish-tutorial-card__pause" onClick={() => setPaused(true)}>
          Pause tutorial
        </button>
      </div>
    </div>,
    document.body,
  );
}
