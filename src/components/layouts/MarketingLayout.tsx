import type { ReactNode } from 'react';
import { SacredBackground } from '@/components/marketing/SacredBackground';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <SacredBackground className="vish-marketing-page flex min-h-screen flex-col">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </SacredBackground>
  );
}
