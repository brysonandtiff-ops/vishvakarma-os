import {
  PROTOTYPE_BADGE,
  PROTOTYPE_MODULE_TEXT,
  type PrototypeModuleVariant,
} from '@/constants/prototypeDisclaimer';

export function PrototypeDisclaimerBadge() {
  return (
    <div
      className="pointer-events-none fixed bottom-2 left-24 z-50 max-w-[min(100vw-7rem,20rem)] text-[11px] tracking-wide text-primary/60 tablet:hidden lg:bottom-3 lg:left-3"
      data-testid="prototype-disclaimer-badge"
      aria-hidden="true"
    >
      {PROTOTYPE_BADGE}
    </div>
  );
}

export function PrototypeModuleNotice({ variant }: { variant: PrototypeModuleVariant }) {
  return (
    <p
      className="rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground"
      data-testid={`prototype-notice-${variant}`}
    >
      {PROTOTYPE_MODULE_TEXT[variant]}
    </p>
  );
}
