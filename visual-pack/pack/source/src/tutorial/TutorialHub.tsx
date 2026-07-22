import { CheckCircle2, Circle, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTutorial } from './TutorialProvider';
import { getTrackProgressPercent, TUTORIAL_TRACKS } from './tutorialCatalog';

export default function TutorialHub() {
  const {
    hubOpen,
    closeHub,
    progress,
    startTrack,
    resumeTrack,
    isTrackCompleted,
    activeTrack,
  } = useTutorial();

  return (
    <Sheet open={hubOpen} onOpenChange={(open) => !open && closeHub()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto border-l border-primary/20 bg-ws-sidebar p-0">
        <SheetHeader className="border-b border-primary/15 px-5 py-4 text-left">
          <SheetTitle className="text-lg font-semibold text-ws-text">Tutorials</SheetTitle>
          <SheetDescription className="text-xs text-ws-text-dim">
            In-app walkthroughs for every major workflow. Hands-on steps wait until you perform the action.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 p-4" data-testid="tutorial-hub">
          {TUTORIAL_TRACKS.map((track) => {
            const completed = isTrackCompleted(track.id);
            const lastStepId = progress.lastStep[track.id];
            const lastIndex = lastStepId ? track.steps.findIndex((s) => s.id === lastStepId) : -1;
            const inProgress = !completed && lastIndex >= 0;
            const percent = getTrackProgressPercent(track, Math.max(0, lastIndex), completed);
            const isActive = activeTrack?.id === track.id;

            return (
              <article
                key={track.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isActive
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-primary/15 bg-white/5'
                }`}
                data-testid={`tutorial-hub-track-${track.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-ws-text-faint" aria-hidden />
                      )}
                      <h3 className="truncate text-sm font-semibold text-ws-text">{track.title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ws-text-dim">{track.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-ws-text-faint">
                      ~{track.estMinutes} min · {track.style}
                    </p>
                  </div>
                </div>

                {(inProgress || completed) && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {inProgress ? (
                    <Button type="button" variant="gold" size="sm" className="min-h-[44px]" onClick={() => resumeTrack(track.id)}>
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </Button>
                  ) : (
                    <Button type="button" variant="gold" size="sm" className="min-h-[44px]" onClick={() => startTrack(track.id)}>
                      <Play className="h-3.5 w-3.5" />
                      {completed ? 'Restart' : 'Start'}
                    </Button>
                  )}
                  {completed && (
                    <Button
                      type="button"
                      variant="goldOutline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => startTrack(track.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Again
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
