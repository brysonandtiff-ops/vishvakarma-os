import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Aligned row for search, filters, and view toggles below page headers. */
export default function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div className={cn('vish-page-toolbar', className)}>
      {children}
    </div>
  );
}
