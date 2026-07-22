import { Sparkles } from 'lucide-react';
import {
  COPILOT_SWAN_FLAP_FRAMES,
  hasCopilotSwanFlapFrames,
  OFFICIAL_LOGO_SRC,
} from '@/brand/officialLogo';
import { cn } from '@/lib/utils';

export type CopilotSwanMotion =
  | 'idle'
  | 'healthy'
  | 'attention'
  | 'scanning'
  | 'fixing'
  | 'generating';

export type CopilotSwanSize = 'xs' | 'sm' | 'md' | 'lg' | 'fab';

const SIZE_CLASS: Record<CopilotSwanSize, string> = {
  xs: 'vish-copilot-swan--xs',
  sm: 'vish-copilot-swan--sm',
  md: 'vish-copilot-swan--md',
  lg: 'vish-copilot-swan--lg',
  fab: 'vish-copilot-swan--fab',
};

const MOTION_CLASS: Record<CopilotSwanMotion, string> = {
  idle: 'vish-copilot-swan--idle',
  healthy: 'vish-copilot-swan--healthy',
  attention: 'vish-copilot-swan--attention',
  scanning: 'vish-copilot-swan--scanning',
  fixing: 'vish-copilot-swan--fixing',
  generating: 'vish-copilot-swan--generating',
};

export default function CopilotSwanMark({
  motion = 'idle',
  size = 'sm',
  showAura = false,
  showSparkle = false,
  issueCount = 0,
  className,
  testId,
  stateLabel,
}: {
  motion?: CopilotSwanMotion;
  size?: CopilotSwanSize;
  showAura?: boolean;
  showSparkle?: boolean;
  issueCount?: number;
  className?: string;
  testId?: string;
  stateLabel?: string;
}) {
  const useFrames = hasCopilotSwanFlapFrames();
  const frameStyle =
    useFrames && COPILOT_SWAN_FLAP_FRAMES[0]
      ? { backgroundImage: `url(${COPILOT_SWAN_FLAP_FRAMES[0]})` }
      : undefined;

  return (
    <span
      className={cn(
        'vish-copilot-swan',
        SIZE_CLASS[size],
        MOTION_CLASS[motion],
        useFrames && 'vish-copilot-swan--frames',
        className,
      )}
      data-testid={testId ?? 'copilot-swan-mark'}
      data-motion={motion}
      data-size={size}
      {...(stateLabel ? { 'data-state': stateLabel } : {})}
      aria-hidden="true"
    >
      {showAura && size === 'fab' && (
        <>
          <span className="vish-copilot-swan__aura vish-copilot-swan__aura--outer" />
          <span className="vish-copilot-swan__aura" />
        </>
      )}
      <span className="vish-copilot-swan__tile">
        <span className="vish-copilot-swan__logo-wrap">
          <img
            src={OFFICIAL_LOGO_SRC}
            alt=""
            className="vish-copilot-swan__logo-body"
            draggable={false}
          />
          {useFrames ? (
            <span
              className="vish-copilot-swan__logo-wing"
              style={frameStyle}
              role="presentation"
            />
          ) : (
            <img
              src={OFFICIAL_LOGO_SRC}
              alt=""
              className="vish-copilot-swan__logo-wing"
              draggable={false}
            />
          )}
        </span>
      </span>
      {showSparkle && size === 'fab' && (
        <Sparkles className="vish-copilot-swan__sparkle h-4 w-4" aria-hidden="true" />
      )}
      {issueCount > 0 && size === 'fab' && (
        <span className="vish-copilot-swan__badge" data-testid="architecture-bot-badge">
          {issueCount > 9 ? '9+' : issueCount}
        </span>
      )}
    </span>
  );
}

/** Maps Architecture Bot animation states to swan motion modes. */
export function architectureBotMotionToSwan(
  state: 'idle' | 'scanning' | 'fixing' | 'healthy' | 'attention',
): CopilotSwanMotion {
  return state;
}
