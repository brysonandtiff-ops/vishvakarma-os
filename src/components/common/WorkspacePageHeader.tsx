import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkspacePageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  variant?: 'fullBleed' | 'inset';
  animate?: boolean;
}

export default function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  actions,
  stats,
  variant = 'inset',
  animate = true,
}: WorkspacePageHeaderProps) {
  const inset = variant === 'inset';

  return (
    <header
      className={cn(
        'gov-page-header shrink-0',
        animate && 'vish-panel-reveal',
        inset
          ? 'vish-crafted-card mb-6 rounded-xl border border-border/60 bg-card/80 px-5 py-5 shadow-sm md:px-6 md:py-6'
          : 'border-b border-border/60 bg-card/40 px-6 py-5 md:px-8',
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="vish-eyebrow text-primary">{eyebrow}</p>
          )}
          <h1 className="text-page-title md:text-page-title-lg font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats && (
        <div className={`flex flex-wrap gap-3 ${inset ? 'mt-5 border-t border-border/50 pt-4' : 'mt-4'}`}>
          {stats}
        </div>
      )}
    </header>
  );
}
