import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SacredBackground } from '@/components/marketing/SacredBackground';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface MarketingLayoutProps {
  children?: ReactNode;
  enableRain?: boolean;
}

export function MarketingLayout({ children, enableRain = true }: MarketingLayoutProps) {
  return (
    <SacredBackground
      className="vish-marketing-page flex min-h-[100dvh] flex-col"
      enableRain={enableRain}
      header={<MarketingNav />}
    >
      <div className="mx-auto w-full max-w-page-marketing flex-1 vish-page-enter">
        {children ?? <Outlet />}
      </div>
      <MarketingFooter />
    </SacredBackground>
  );
}
