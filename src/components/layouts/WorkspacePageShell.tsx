import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkspacePageShellProps {
  variant?: 'governance' | 'document';
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export default function WorkspacePageShell({
  variant = 'document',
  children,
  className = '',
  animate = true,
}: WorkspacePageShellProps) {
  if (variant === 'governance') {
    return (
      <div
        className={cn(
          'vish-governance-shell flex h-full flex-col overflow-hidden bg-background',
          animate && 'vish-page-enter',
          className,
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[88rem] flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-6xl p-6 md:p-8', animate && 'vish-page-enter', className)}>
      {children}
    </div>
  );
}

export function WorkspacePageScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea className={cn('flex-1 gov-scroll-area', className)}>
      {children}
    </ScrollArea>
  );
}
