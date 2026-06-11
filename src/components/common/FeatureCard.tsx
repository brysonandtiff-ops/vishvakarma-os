import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  badge,
  footer,
  onClick,
  className = '',
}: FeatureCardProps) {
  const Wrapper = onClick ? 'button' : 'article';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`vish-feature-grid-card vish-glass-panel--interactive group flex h-full flex-col rounded-xl p-5 text-left ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        {badge && (
          <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary/90">
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
