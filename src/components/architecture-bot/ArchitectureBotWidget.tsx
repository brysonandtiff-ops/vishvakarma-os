import { cn } from '@/lib/utils';
import ArchitectureBotCharacter from '@/components/architecture-bot/ArchitectureBotCharacter';
import ArchitectureBotPanel from '@/components/architecture-bot/ArchitectureBotPanel';
import type { ArchitectureBotAnimationState, ArchitectureIssue } from '@/services/architecture-bot/types';

export default function ArchitectureBotWidget({
  visible = true,
  panelOpen,
  issues,
  issueCount,
  animationState,
  fixing,
  onTogglePanel,
  onClosePanel,
  onFixEverything,
  onOpenCopilot,
  onOpenCompliance,
  className,
}: {
  visible?: boolean;
  panelOpen: boolean;
  issues: ArchitectureIssue[];
  issueCount: number;
  animationState: ArchitectureBotAnimationState;
  fixing: boolean;
  onTogglePanel: () => void;
  onClosePanel: () => void;
  onFixEverything: () => void;
  onOpenCopilot?: () => void;
  onOpenCompliance?: () => void;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div
      className={cn('vish-arch-bot-root absolute bottom-4 left-4 z-30 flex flex-col items-start gap-3', className)}
      data-testid="architecture-bot-widget"
    >
      {panelOpen && (
        <div className="vish-arch-bot-panel-rise">
          <ArchitectureBotPanel
          issues={issues}
          fixing={fixing}
          onFixEverything={onFixEverything}
          onOpenCopilot={onOpenCopilot}
          onOpenCompliance={onOpenCompliance}
          onClose={onClosePanel}
        />
        </div>
      )}

      <button
        type="button"
        className="vish-pressable touch-target rounded-2xl outline-none ring-offset-background transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onTogglePanel}
        aria-label={panelOpen ? 'Close Architecture Bot' : 'Open Architecture Bot'}
        aria-expanded={panelOpen}
        data-testid="architecture-bot-toggle"
      >
        <ArchitectureBotCharacter state={animationState} issueCount={issueCount} />
      </button>
    </div>
  );
}
