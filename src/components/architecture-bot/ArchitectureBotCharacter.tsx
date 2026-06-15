import { Sparkles } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { cn } from '@/lib/utils';
import type { ArchitectureBotAnimationState } from '@/services/architecture-bot/types';

const STATE_CLASS: Record<ArchitectureBotAnimationState, string> = {
  idle: 'vish-arch-bot-idle',
  scanning: 'vish-arch-bot-scan',
  fixing: 'vish-arch-bot-fix',
  healthy: 'vish-arch-bot-success',
  attention: 'vish-arch-bot-attention',
};

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
    <div
      className={cn('vish-arch-bot-character', STATE_CLASS[state], className)}
      data-testid="architecture-bot-character"
      data-state={state}
      aria-hidden="true"
    >
      <span className="vish-arch-bot-aura vish-arch-bot-aura--outer" />
      <span className="vish-arch-bot-aura" />
      <div className="vish-arch-bot-logo-tile">
        <img
          src={OFFICIAL_LOGO_SRC}
          alt=""
          className="h-full w-full rounded-xl object-cover"
          draggable={false}
        />
      </div>
      <Sparkles className="vish-arch-bot-sparkle h-4 w-4" aria-hidden="true" />
      {issueCount > 0 && (
        <span className="vish-arch-bot-badge" data-testid="architecture-bot-badge">
          {issueCount > 9 ? '9+' : issueCount}
        </span>
      )}
    </div>
  );
}
