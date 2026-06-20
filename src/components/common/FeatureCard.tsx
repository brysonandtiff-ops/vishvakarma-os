import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  /** Muted styling for preview / not-yet-available modules */
  preview?: boolean;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  badge,
  preview = false,
  footer,
  onClick,
  className = '',
}: FeatureCardProps) {
  const Wrapper = onClick ? 'button' : 'article';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`vish-feature-grid-card vish-glass-panel vish-glass-depth vish-glass-panel--interactive group flex h-full flex-col rounded-xl p-5 text-left ${preview ? 'vish-feature-grid-card--preview' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary ${preview ? 'border-border/40 bg-muted/30 text-muted-foreground' : 'border-primary/25'}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        {badge && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${preview ? 'vish-feature-badge--preview' : 'border-primary/30 text-primary/90'}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-semibold vish-text-heading">{title}</h3>
      {description && <p className="mt-2 flex-1 text-sm leading-relaxed vish-text-body">{description}</p>}
      {footer && <div className="vish-feature-grid-card__footer mt-4 border-t pt-3">{footer}</div>}
    </Wrapper>
  );
}
