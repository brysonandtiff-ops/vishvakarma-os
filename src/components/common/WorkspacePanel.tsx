import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PanelTone = 'light' | 'dark' | 'governance';

const TONE_CLASS: Record<PanelTone, string> = {
  light: 'ws-panel-light border-border/60 bg-card/90',
  dark: 'ws-panel-dark vish-dark-panel border-ws-border bg-ws-toolbar/80 text-ws-text',
  governance: 'vish-gov-card-dark border-border/50 bg-card/80',
};

interface WorkspacePanelProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  tone?: PanelTone;
  className?: string;
  headerClassName?: string;
  padded?: boolean;
}

export default function WorkspacePanel({
  children,
  title,
  description,
  actions,
  tone = 'light',
  className,
  headerClassName,
  padded = true,
}: WorkspacePanelProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className={cn('rounded-xl border shadow-sm', TONE_CLASS[tone], className)}>
      {hasHeader && (
        <header
          className={cn(
            'ws-pane-header flex flex-col gap-2 border-b border-inherit px-4 py-3 sm:flex-row sm:items-start sm:justify-between',
            headerClassName,
          )}
        >
          <div className="min-w-0 space-y-1">
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-4 md:p-5')}>{children}</div>
    </section>
  );
}
