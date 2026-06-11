import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { cn } from '@/lib/utils';

function navLinkClass(pathname: string, href: string) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return cn('vish-marketing-nav-link', isActive && 'vish-marketing-nav-link--active');
}

export function MarketingNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const ctaTo = user ? '/editor' : '/auth';
  const ctaLabel = user ? 'Open Editor' : 'Start Free';
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="vish-marketing-nav sticky top-0 z-50 px-4 py-3 md:px-8 md:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to="/" className="vish-marketing-nav-brand flex items-center gap-3 no-underline" onClick={closeMobile}>
          <span className="vish-marketing-nav-logo">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS" className="h-9 w-9 rounded-xl object-cover" />
          </span>
          <span className="vish-wordmark vish-marketing-nav-wordmark hidden text-sm font-bold tracking-[0.24em] sm:inline">
            VISHVAKARMA.OS
          </span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex" aria-label="Marketing">
          <Link to="/features" className={navLinkClass(pathname, '/features')}>
            Features
          </Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className={navLinkClass(pathname, '/pricing')}>
              Pricing
            </Link>
          )}
          <span className="mx-2 h-5 w-px bg-primary/20" aria-hidden />
          <Link to={ctaTo} className="vish-gold-cta px-5 py-2.5 text-[0.65rem]">
            {ctaLabel}
          </Link>
        </nav>
        <button
          type="button"
          className="vish-marketing-nav-menu-btn touch-target flex h-11 w-11 items-center justify-center rounded-xl md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="vish-marketing-nav-mobile mx-auto mt-3 max-w-6xl md:hidden" aria-label="Marketing mobile">
          <Link to="/features" className={navLinkClass(pathname, '/features')} onClick={closeMobile}>
            Features
          </Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className={navLinkClass(pathname, '/pricing')} onClick={closeMobile}>
              Pricing
            </Link>
          )}
          <Link to={ctaTo} className="vish-gold-cta mt-1 w-full text-center text-[0.65rem]" onClick={closeMobile}>
            {ctaLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
