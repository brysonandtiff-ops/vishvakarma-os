import type { ReactNode } from 'react';

interface WorkspacePageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  variant?: 'fullBleed' | 'inset';
}

export default function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  actions,
  stats,
  variant = 'inset',
}: WorkspacePageHeaderProps) {
  const inset = variant === 'inset';

  return (
    <header
      className={`gov-page-header shrink-0 ${
        inset
          ? 'mb-6 rounded-xl border border-border/60 bg-card/80 px-5 py-5 shadow-sm md:px-6 md:py-6'
          : 'border-b border-border/60 bg-card/40 px-6 py-5 md:px-8'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          )}
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
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
