import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';

export function MarketingNav() {
  const { user } = useAuth();
  const ctaTo = user ? '/editor' : '/auth';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="vish-marketing-nav sticky top-0 z-50 px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Vishvakarma.OS"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <span className="vish-wordmark text-sm font-bold tracking-[0.24em] vish-text-heading">
            VISHVAKARMA.OS
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Marketing">
          <Link to="/features" className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-primary">
            Features
          </Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 hover:text-primary">
              Pricing
            </Link>
          )}
          <Link to={ctaTo} className="vish-gold-cta px-6 py-2.5 text-[0.65rem]">
            Start Free
          </Link>
        </nav>
        <button
          type="button"
          className="touch-target flex h-11 w-11 items-center justify-center rounded-lg border border-border/50 text-foreground md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="mx-auto mt-4 flex max-w-6xl flex-col gap-3 border-t border-border/40 pt-4 md:hidden" aria-label="Marketing mobile">
          <Link to="/features" className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground" onClick={() => setMobileOpen(false)}>
            Features
          </Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
          )}
          <Link to={ctaTo} className="vish-gold-cta w-full text-center text-[0.65rem]" onClick={() => setMobileOpen(false)}>
            Start Free
          </Link>
        </nav>
      )}
    </header>
  );
}
