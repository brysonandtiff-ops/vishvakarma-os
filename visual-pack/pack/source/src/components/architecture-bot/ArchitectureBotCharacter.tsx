import CopilotSwanMark, { architectureBotMotionToSwan } from '@/components/brand/CopilotSwanMark';
import { cn } from '@/lib/utils';
import type { ArchitectureBotAnimationState } from '@/services/architecture-bot/types';

export default function ArchitectureBotCharacter({
  state,
  issueCount = 0,
  className,
}: {
  state: ArchitectureBotAnimationState;
  issueCount?: number;
  className?: string;
}) {
  return (
    <CopilotSwanMark
      motion={architectureBotMotionToSwan(state)}
      size="fab"
      showAura
      showSparkle
      issueCount={issueCount}
      stateLabel={state}
      className={cn('vish-arch-bot-character', className)}
      testId="architecture-bot-character"
    />
  );
}
