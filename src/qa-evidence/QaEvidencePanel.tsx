import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Grid3x3,
  RefreshCw,
  Sparkles,
  Tablet,
  Volume2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { startGuidedDemoSession } from '@/demo-session/GuidedDemoSessionController';
import { OPEN_VOICE_TOUR_EVENT } from '@/voice-tour/voiceTourContent';

export const OPEN_QA_EVIDENCE_EVENT = 'vish:open-qa-evidence';

type EvidenceState = 'pending' | 'passed';

type EvidenceItem = {
  id: string;
  title: string;
  description: string;
  route?: string;
  icon: typeof ClipboardCheck;
  steps: string[];
  actionLabel: string;
  runAction: (helpers: { navigate: ReturnType<typeof useNavigate> }) => void;
};

const STORAGE_KEY = 'vish-qa-evidence-status-v1';

const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ipad-pwa-refresh',
    title: 'iPad PWA refresh',
    description: 'Confirm the installed iPad app updates to the newest Vercel build.',
    icon: Tablet,
    route: '/editor',
    actionLabel: 'Open editor',
    steps: [
      'Close the installed iPad PWA fully.',
      'Reopen Vishvakarma.OS from the Home Screen.',
      'Wait up to 60 seconds for the service worker update check.',
      'Open /editor and confirm the latest UI is visible.',
    ],
    runAction: ({ navigate }) => navigate('/editor'),
  },
  {
    id: 'editor-demo-grid',
    title: 'Editor demo + grid',
    description: 'Confirm the visible Demo and Grid controls work on iPad.',
    icon: Grid3x3,
    route: '/editor',
    actionLabel: 'Open editor',
    steps: [
      'Open /editor.',
      'Confirm Demo and Grid on/off are visible in the top toolbar.',
      'Tap Demo and load a sample blueprint.',
      'Toggle Grid on/off and confirm the canvas changes visibly.',
    ],
    runAction: ({ navigate }) => navigate('/editor'),
  },
  {
    id: 'guided-demo-session',
    title: 'Guided demo session',
    description: 'Confirm one button starts sample, grid, 3D, voice, and overlay together.',
    icon: Sparkles,
    route: '/editor',
    actionLabel: 'Start demo',
    steps: [
      'Tap Start demo from the editor toolbar or command palette.',
      'Confirm Full Feature Showcase loads.',
      'Confirm Grid on, Snap on, and 3D open.',
      'Confirm Voice Tour and Essentials overlay appear.',
    ],
    runAction: () => startGuidedDemoSession({ autoPlayVoice: true }),
  },
  {
    id: 'voice-tour',
    title: 'Voice tour',
    description: 'Confirm browser voice, pause/resume, MP3 fallback, and overlay steps.',
    icon: Volume2,
    route: '/editor',
    actionLabel: 'Open voice',
    steps: [
      'Tap Voice tour.',
      'Press Play and confirm speech starts.',
      'Press Pause, Resume, then Next.',
      'Turn on MP3 first and confirm missing MP3 falls back to browser voice.',
      'Tap Overlay steps and confirm tutorial overlay opens.',
    ],
    runAction: () => {
      window.dispatchEvent(new CustomEvent(OPEN_VOICE_TOUR_EVENT, { detail: { autoPlay: true } }));
    },
  },
  {
    id: 'auth-contract',
    title: 'Auth contract',
    description: 'Confirm auth visual polish did not break sign-in wording or selectors.',
    icon: ClipboardCheck,
    route: '/auth',
    actionLabel: 'Open auth',
    steps: [
      'Open /auth.',
      'Confirm official swan branding is visible.',
      'Confirm Google SSO wording/accessibility remains test-safe.',
      'Confirm auth screen layout still follows the blue/gold reference direction.',
    ],
    runAction: ({ navigate }) => navigate('/auth'),
  },
  {
    id: 'fresh-build-smoke',
    title: 'Fresh build smoke',
    description: 'Quick sweep for routes after release polish.',
    icon: RefreshCw,
    route: '/',
    actionLabel: 'Open home',
    steps: [
      'Open the home screen.',
      'Open Projects, Editor, 3D Room, Optimization, and Profile.',
      'Confirm no route shows a blank screen or crash card.',
      'Confirm command palette opens with Ctrl/Cmd+K.',
    ],
    runAction: ({ navigate }) => navigate('/'),
  },
];

function readEvidenceState(): Record<string, EvidenceState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, EvidenceState>) : {};
  } catch {
    return {};
  }
}

function writeEvidenceState(value: Record<string, EvidenceState>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in private modes.
  }
}

export function openQaEvidencePanel() {
  window.dispatchEvent(new Event(OPEN_QA_EVIDENCE_EVENT));
}

export default function QaEvidencePanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, EvidenceState>>(() => readEvidenceState());

  const completedCount = useMemo(
    () => EVIDENCE_ITEMS.filter((item) => states[item.id] === 'passed').length,
    [states],
  );

  const setItemState = useCallback((id: string, state: EvidenceState) => {
    setStates((prev) => {
      const next = { ...prev, [id]: state };
      writeEvidenceState(next);
      return next;
    });
  }, []);

  const copySteps = useCallback(async (item: EvidenceItem) => {
    const text = [`${item.title} evidence steps:`, ...item.steps.map((step, index) => `${index + 1}. ${step}`)].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Evidence steps copied');
    } catch {
      toast.message('Evidence steps', { description: text });
    }
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_QA_EVIDENCE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_QA_EVIDENCE_EVENT, onOpen);
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        className="vish-qa-evidence-launch touch-target"
        onClick={() => setOpen(true)}
        aria-label="Open QA evidence panel"
      >
        <ClipboardCheck className="h-4 w-4" />
        QA Evidence
      </button>
    );
  }

  return (
    <aside className="vish-qa-evidence-panel" aria-label="QA evidence mode">
      <div className="vish-qa-evidence-panel__header">
        <div>
          <p className="vish-qa-evidence-panel__eyebrow">Proof mode</p>
          <h2>QA Evidence</h2>
          <span>{completedCount}/{EVIDENCE_ITEMS.length} proof checks marked passed</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close QA evidence panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="vish-qa-evidence-panel__list">
        {EVIDENCE_ITEMS.map((item) => {
          const passed = states[item.id] === 'passed';
          const Icon = item.icon;
          return (
            <article key={item.id} className={`vish-qa-evidence-card ${passed ? 'passed' : ''}`}>
              <div className="vish-qa-evidence-card__title">
                <Icon className="h-4 w-4" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                {passed && <CheckCircle2 className="h-4 w-4" aria-label="Passed" />}
              </div>
              <ol>
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="vish-qa-evidence-card__actions">
                <button type="button" onClick={() => item.runAction({ navigate })}>
                  {item.actionLabel}
                </button>
                <button type="button" onClick={() => copySteps(item)}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <button type="button" onClick={() => setItemState(item.id, passed ? 'pending' : 'passed')}>
                  {passed ? 'Undo pass' : 'Mark passed'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
