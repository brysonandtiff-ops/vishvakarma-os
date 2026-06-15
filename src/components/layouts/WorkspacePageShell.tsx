import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PageWidth } from '@/config/RouteNavConfig';
import { WIDTH_CLASS } from '@/components/common/PageContainer';

interface WorkspacePageShellProps {
  variant?: 'governance' | 'document';
  width?: PageWidth;
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export default function WorkspacePageShell({
  variant = 'document',
  width = 'standard',
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
        <div className={cn('mx-auto flex h-full w-full flex-col', WIDTH_CLASS.wide)}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mx-auto w-full px-page-x py-page-y',
        WIDTH_CLASS[width],
        animate && 'vish-page-enter',
        className,
      )}
    >
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
