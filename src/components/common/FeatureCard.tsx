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
      className={`vish-feature-grid-card group flex h-full flex-col rounded-xl border border-border/50 bg-card/60 p-5 text-left transition-colors hover:border-primary/35 hover:bg-card/90 ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {footer && <div className="mt-4 border-t border-border/40 pt-3">{footer}</div>}
    </Wrapper>
  );
}
