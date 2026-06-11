import { CO_OWNER, FOUNDER, FOUNDERS_ARIA_LABEL, STUDIO_NAME } from '@/brand/founders';

type FoundersVariant = 'auth' | 'footer' | 'sidebar';

interface FoundersAcknowledgmentProps {
  variant: FoundersVariant;
}

export function FoundersAcknowledgment({ variant }: FoundersAcknowledgmentProps) {
  if (variant === 'auth') {
    return (
      <div
        className="vish-auth-founders-line"
        aria-label={FOUNDERS_ARIA_LABEL}
        data-testid="founders-acknowledgment-auth"
      >
        <p className="vish-auth-founders-line__studio">{STUDIO_NAME}</p>
        <p className="vish-auth-founders-line__credit">
          {FOUNDER.name} — {FOUNDER.title}
        </p>
        <p className="vish-auth-founders-line__credit">
          {CO_OWNER.name} — {CO_OWNER.title}
        </p>
      </div>
    );
  }

  if (variant === 'footer') {
    const year = new Date().getFullYear();
    return (
      <div
        className="vish-marketing-founders"
        aria-label={FOUNDERS_ARIA_LABEL}
        data-testid="founders-acknowledgment-footer"
      >
        <p className="vish-marketing-founders__copyright">
          &copy; {year} {STUDIO_NAME} &middot; Vishvakarma.OS
        </p>
        <p className="vish-marketing-founders__credit">
          {FOUNDER.name} & {CO_OWNER.name} — {FOUNDER.title}
        </p>
      </div>
    );
  }

  return (
    <div
      className="vish-sidebar-founders border-t border-ws-border/60 px-1 pt-2"
      aria-label={FOUNDERS_ARIA_LABEL}
      data-testid="founders-acknowledgment-sidebar"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ws-text-faint">
        {STUDIO_NAME}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-ws-text-faint">
        {FOUNDER.name}
        <span className="block text-[9px] leading-tight">{FOUNDER.title}</span>
      </p>
      <p className="mt-1 text-[10px] text-ws-text-faint">
        {CO_OWNER.name} &middot; {CO_OWNER.title}
      </p>
    </div>
  );
}
