import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GridCols = 2 | 3 | 4;

export default function PageSectionGrid({
  children,
  cols = 3,
  className,
  stagger = true,
}: {
  children: ReactNode;
  cols?: GridCols;
  className?: string;
  stagger?: boolean;
}) {
  const colClass =
    cols === 2
      ? 'sm:grid-cols-2'
      :         cols === 4
        ? 'sm:grid-cols-2 tablet:grid-cols-4'
        : 'sm:grid-cols-2 tablet:grid-cols-3';

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-5',
        colClass,
        stagger && 'vish-stagger-children',
        className,
      )}
    >
      {children}
    </div>
  );
}
