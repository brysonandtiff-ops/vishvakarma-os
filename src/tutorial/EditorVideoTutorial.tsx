import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Film,
  ListVideo,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { useReliablePress } from '@/hooks/useReliablePress';
import '@/styles/vish-tutorial.css';

const VIDEO_TUTORIAL_DISMISSED_KEY = 'vishvakarma.os.editorVideoTutorialDismissed.v1';
const CHAPTER_DURATION_MS = 6500;

const VIDEO_TUTORIAL_CHAPTERS = [
  {
    id: 'orientation',
    title: 'Start here: editor map',
    eyebrow: '00:00 · Orientation',
    body: 'Top bar controls projects, 3D, grid, help, and workspace navigation. The left rail is where every drawing tool starts.',
    feature: 'Project actions · grid · 3D · help',
  },
  {
    id: 'draw',
    title: 'Draw walls, doors, and windows',
    eyebrow: '00:35 · Drafting basics',
    body: 'Use Wall, Door, Window, Room, Measure, Dimension, and Text tools. On iPad, tap once to pick a tool and tap the canvas to place geometry.',
    feature: 'Wall · Door · Window · Room · Dimension',
  },
  {
    id: 'navigation',
    title: 'Move around confidently',
    eyebrow: '01:25 · iPad gestures',
    body: 'Pinch to zoom, drag to pan, use Reset view when lost, and keep Grid/Snap/Dimensions visible from the editor chrome.',
    feature: 'Zoom · Reset view · Grid · Snap · Dims',
  },
  {
    id: 'modes',
    title: 'Workspace modes unlock more tools',
    eyebrow: '02:05 · Modes',
    body: 'Draft is for structure, MEP is for services, Interior is for furniture/materials, Landscape is for site elements, and Walk is for walkthrough review.',
    feature: 'Draft · MEP · Interior · Landscape · Walk',
  },
  {
    id: 'three-d',
    title: 'Live 3D preview',
    eyebrow: '02:55 · Model chamber',
    body: 'Toggle 3D to check wall heights, openings, furniture, terrain, lighting, floors, and presentation view without exporting.',
    feature: '3D chamber · floors · materials · lighting',
  },
  {
    id: 'proof',
    title: 'Project Proof and compliance',
    eyebrow: '03:45 · Governance',
    body: 'Project Proof keeps save state, counts, compliance status, and export readiness visible so users understand what is safe to share.',
    feature: 'Project Proof · compliance · audit trail',
  },
  {
    id: 'ai-export',
    title: 'AI, samples, save, and export',
    eyebrow: '04:35 · Finish workflow',
    body: 'Load sample blueprints, use Architecture Copilot, save local/cloud projects, and export PDF, image, JSON, SVG, DXF, or IFC packages.',
    feature: 'Samples · Copilot · Save · Export',
  },
] as const;

type EditorVideoTutorialProps = {
  pathname: string;
  activeTrackId: string | null;
  hubOpen: boolean;
  completedEssentials: boolean;
  startTrack: (trackId: string, stepIndex?: number) => void;
  openHub: () => void;
};

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hasDismissedVideoTutorial() {
  if (!hasStorage()) return true;
  return window.localStorage.getItem(VIDEO_TUTORIAL_DISMISSED_KEY) === '1';
}

function dismissVideoTutorial() {
  if (!hasStorage()) return;
  window.localStorage.setItem(VIDEO_TUTORIAL_DISMISSED_KEY, '1');
}

function TutorialButton({
  label,
  className,
  onPress,
  children,
}: {
  label: string;
  className: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const pressHandlers = useReliablePress(onPress);

  return (
    <button type="button" aria-label={label} className={className} {...pressHandlers}>
      {children}
    </button>
  );
}

export default function EditorVideoTutorial({
  pathname,
  activeTrackId,
  hubOpen,
  completedEssentials,
  startTrack,
  openHub,
}: EditorVideoTutorialProps) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [chapterIndex, setChapterIndex] = useState(0);
  const autoOpenDisabled =
    import.meta.env.MODE === 'e2e' || import.meta.env.VITE_DISABLE_EDITOR_VIDEO_TUTORIAL === 'true';

  useEffect(() => {
    if (autoOpenDisabled) return;
    if (pathname !== '/editor' || activeTrackId || hubOpen || hasDismissedVideoTutorial()) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      setPlaying(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [activeTrackId, autoOpenDisabled, hubOpen, pathname]);

  useEffect(() => {
    if (!open || !playing) return;

    const timer = window.setInterval(() => {
      setChapterIndex((index) => (index + 1) % VIDEO_TUTORIAL_CHAPTERS.length);
    }, CHAPTER_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [open, playing]);

  const activeChapter = VIDEO_TUTORIAL_CHAPTERS[chapterIndex];
  const progressPercent = useMemo(
    () => ((chapterIndex + 1) / VIDEO_TUTORIAL_CHAPTERS.length) * 100,
    [chapterIndex],
  );

  const close = (remember: boolean) => {
    if (remember) dismissVideoTutorial();
    setOpen(false);
    setPlaying(false);
  };

  const startInteractiveTour = () => {
    dismissVideoTutorial();
    setOpen(false);
    setPlaying(false);
    startTrack('essentials', 0);
  };

  const showAllTutorials = () => {
    dismissVideoTutorial();
    setOpen(false);
    setPlaying(false);
    openHub();
  };

  if (!open || pathname !== '/editor') return null;

  return (
    <div className="vish-video-tutorial-root" role="presentation" data-testid="editor-video-tutorial">
      <button
        type="button"
        className="vish-video-tutorial-scrim"
        aria-label="Close editor video tutorial"
        onClick={() => close(false)}
      />
      <section
        className="vish-video-tutorial-panel vish-glass-panel vish-glass-panel--interactive"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-video-tutorial-title"
      >
        <div className="vish-video-tutorial-header">
          <div className="flex min-w-0 items-center gap-3">
            <span className="vish-video-tutorial-mark" aria-hidden>
              <Film className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="vish-video-tutorial-kicker">First-time editor walkthrough</p>
              <h2 id="editor-video-tutorial-title" className="vish-video-tutorial-title">
                Watch the Vishvakarma.OS editor tour
              </h2>
            </div>
          </div>
          <TutorialButton
            label="Close tutorial"
            className="vish-video-tutorial-close touch-target"
            onPress={() => close(false)}
          >
            <X className="h-4 w-4" />
          </TutorialButton>
        </div>

        <div className="vish-video-tutorial-player" aria-live="polite">
          <div className="vish-video-tutorial-frame">
            <div className="vish-video-tutorial-frame__chrome">
              <span />
              <span />
              <span />
            </div>
            <p className="vish-video-tutorial-eyebrow">{activeChapter.eyebrow}</p>
            <h3>{activeChapter.title}</h3>
            <p>{activeChapter.body}</p>
            <div className="vish-video-tutorial-feature">
              <Sparkles className="h-4 w-4" aria-hidden />
              {activeChapter.feature}
            </div>
          </div>
          <div className="vish-video-tutorial-timeline" aria-hidden>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="vish-video-tutorial-controls">
            <TutorialButton
              label={playing ? 'Pause editor tutorial video' : 'Play editor tutorial video'}
              className="vish-video-tutorial-control touch-target"
              onPress={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Pause' : 'Play'}
            </TutorialButton>
            <TutorialButton
              label="Next tutorial chapter"
              className="vish-video-tutorial-control touch-target"
              onPress={() => setChapterIndex((index) => (index + 1) % VIDEO_TUTORIAL_CHAPTERS.length)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </TutorialButton>
          </div>
        </div>

        <div className="vish-video-tutorial-chapters" aria-label="Tutorial chapters">
          {VIDEO_TUTORIAL_CHAPTERS.map((chapter, index) => (
            <TutorialButton
              key={chapter.id}
              label={`Open chapter: ${chapter.title}`}
              className={`vish-video-tutorial-chapter ${index === chapterIndex ? 'active' : ''}`}
              onPress={() => {
                setChapterIndex(index);
                setPlaying(false);
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{chapter.title}</strong>
            </TutorialButton>
          ))}
        </div>

        <div className="vish-video-tutorial-footer">
          <div className="vish-video-tutorial-progress-note">
            {completedEssentials ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Essentials tour completed
              </>
            ) : (
              <>
                <ListVideo className="h-4 w-4" aria-hidden /> New users can continue into the hands-on tour
              </>
            )}
          </div>
          <div className="vish-video-tutorial-footer__actions">
            <TutorialButton
              label="Do not show this tutorial again"
              className="vish-video-tutorial-secondary touch-target"
              onPress={() => close(true)}
            >
              Skip for now
            </TutorialButton>
            <TutorialButton
              label="Show all tutorials"
              className="vish-video-tutorial-secondary touch-target"
              onPress={showAllTutorials}
            >
              All tutorials
            </TutorialButton>
            <TutorialButton
              label="Start interactive editor tour"
              className="vish-video-tutorial-primary touch-target"
              onPress={startInteractiveTour}
            >
              Start guided tour
              <ChevronRight className="h-4 w-4" />
            </TutorialButton>
          </div>
        </div>
      </section>
    </div>
  );
}

export { VIDEO_TUTORIAL_CHAPTERS, VIDEO_TUTORIAL_DISMISSED_KEY };
