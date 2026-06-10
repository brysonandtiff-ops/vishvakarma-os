import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <div className={`flex h-full flex-col overflow-hidden bg-background ${className}`.trim()}>
        {children}
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-6xl p-6 md:p-8 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function WorkspacePageScroll({ children }: { children: ReactNode }) {
  return <ScrollArea className="flex-1">{children}</ScrollArea>;
}
