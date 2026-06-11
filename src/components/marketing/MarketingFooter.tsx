import { Link } from 'react-router-dom';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';

export function MarketingFooter() {
  const { user } = useAuth();
  const accountTo = user ? '/editor' : '/auth';
  const accountLabel = user ? 'Open Editor' : 'Sign In';

  return (
    <footer className="border-t border-primary/20 px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={OFFICIAL_LOGO_SRC} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="text-xs font-bold tracking-[0.24em] vish-text-heading">VISHVAKARMA.OS</span>
        </div>
        <nav className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/features" className="hover:text-primary">Features</Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className="hover:text-primary">Pricing</Link>
          )}
          <Link to={accountTo} className="hover:text-primary">{accountLabel}</Link>
        </nav>
        <FoundersAcknowledgment variant="footer" />
      </div>
    </footer>
  );
}
