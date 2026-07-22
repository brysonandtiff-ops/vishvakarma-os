import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatPillProps {
  children: ReactNode;
  className?: string;
}

/** Compact stat badge for page headers and toolbars. */
export default function StatPill({ children, className }: StatPillProps) {
  return (
    <span
      className={cn(
        'vish-stat-pill-depth inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold tabular-nums text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
