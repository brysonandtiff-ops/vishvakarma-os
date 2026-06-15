import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import PageSection from '@/components/common/PageSection';

interface MarketingSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

/** Marketing page section with consistent max-width and optional top divider. */
export default function MarketingSection({
  title,
  description,
  children,
  className,
  bordered = true,
}: MarketingSectionProps) {
  return (
    <PageSection
      title={title}
      description={description}
      className={cn(
        'vish-marketing-section',
        bordered && 'vish-marketing-section--bordered',
        className,
      )}
    >
      {children}
    </PageSection>
  );
}
