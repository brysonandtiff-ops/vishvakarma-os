import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkspacePageShellProps {
  variant?: 'governance' | 'document';
  children: ReactNode;
  className?: string;
}

export default function WorkspacePageShell({
  variant = 'document',
  children,
  className = '',
}: WorkspacePageShellProps) {
  if (variant === 'governance') {
    return (
      <div
        className={cn(
          'vish-governance-shell flex h-full flex-col overflow-hidden bg-background',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-6xl p-6 md:p-8', className)}>
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
