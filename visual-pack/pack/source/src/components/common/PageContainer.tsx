import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PageWidth } from '@/config/RouteNavConfig';

const WIDTH_CLASS: Record<PageWidth, string> = {
  narrow: 'max-w-page-narrow',
  standard: 'max-w-page-standard',
  wide: 'max-w-page-wide',
};

interface PageContainerProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
}

export default function PageContainer({
  children,
  width = 'standard',
  className,
}: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-page-x py-page-y', WIDTH_CLASS[width], className)}>
      {children}
    </div>
  );
}

export { WIDTH_CLASS };
