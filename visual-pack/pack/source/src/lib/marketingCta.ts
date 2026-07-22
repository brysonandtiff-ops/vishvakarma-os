import type { AuthUser } from '@/contexts/authContextTypes';

export type MarketingCtaLink = {
  to: string;
  label: string;
};

export type MarketingCta = {
  to: string;
  primary: string;
  navPrimary: string;
  secondary: MarketingCtaLink | null;
};

export function getMarketingCta(user: AuthUser | null): MarketingCta {
  if (user) {
    return {
      to: '/editor',
      primary: 'Open Editor →',
      navPrimary: 'Open Editor',
      secondary: null,
    };
  }

  return {
    to: '/auth',
    primary: 'Start Free →',
    navPrimary: 'Start Free',
    secondary: { to: '/features', label: 'See All Features' },
  };
}
