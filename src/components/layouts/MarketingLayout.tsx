import type { ReactNode } from 'react';
import { SacredBackground } from '@/components/marketing/SacredBackground';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface MarketingLayoutProps {
  children: ReactNode;
  enableRain?: boolean;
}

export function MarketingLayout({ children, enableRain = true }: MarketingLayoutProps) {
  return (
    <SacredBackground className="vish-marketing-page flex min-h-screen flex-col" enableRain={enableRain}>
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </SacredBackground>
  );
}
