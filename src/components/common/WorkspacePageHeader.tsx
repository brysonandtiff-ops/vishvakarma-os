import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type WorkspacePageHeaderZone = 'document' | 'governance';

interface WorkspacePageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  /** Layout width: inset card vs full-bleed bar */
  variant?: 'fullBleed' | 'inset';
  /** Visual zone — document (light) vs governance (dark gradient) */
  zone?: WorkspacePageHeaderZone;
  animate?: boolean;
}

export default function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  actions,
  stats,
  variant = 'inset',
  zone = 'document',
  animate = true,
}: WorkspacePageHeaderProps) {
  const inset = variant === 'inset';
  const isGovernance = zone === 'governance';

  return (
    <header
      className={cn(
        'workspace-page-header shrink-0',
        isGovernance ? 'vish-gov-page-header gov-page-header' : 'vish-doc-page-header gov-page-header',
        animate && 'vish-panel-reveal',
        isGovernance
          ? inset
            ? 'mb-6 rounded-xl border border-border/60 px-5 py-5 md:px-6 md:py-6'
            : 'border-b border-border/60 px-6 py-5 md:px-8'
          : inset
            ? 'vish-crafted-card mb-6 rounded-card-lg border border-border/60 bg-card/80 px-5 py-5 shadow-sm md:px-6 md:py-6'
            : 'border-b border-border/60 bg-card/40 px-6 py-5 md:px-8',
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="vish-eyebrow text-primary">{eyebrow}</p>
          )}
          <h1 className="text-page-title font-bold tracking-tight text-foreground md:text-page-title-lg">{title}</h1>
          {description && (
            <p className="max-w-prose-content text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats && (
        <div className={cn('flex flex-wrap gap-3', inset ? 'mt-5 border-t border-border/50 pt-4' : 'mt-4')}>
          {stats}
        </div>
      )}
    </header>
  );
}
