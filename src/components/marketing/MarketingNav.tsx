import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function navLinkClass(pathname: string, href: string) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return cn('vish-marketing-nav-link', isActive && 'vish-marketing-nav-link--active');
}

export function MarketingNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const ctaTo = user ? '/editor' : '/auth';
  const ctaLabel = user ? 'Open Editor' : 'Start Free';

  const navLinks = (
    <>
      <Link to="/features" className={navLinkClass(pathname, '/features')}>
        Features
      </Link>
      {PRICING_PAGE_ENABLED && (
        <Link to="/pricing" className={navLinkClass(pathname, '/pricing')}>
          Pricing
        </Link>
      )}
    </>
  );

  return (
    <header className="vish-marketing-nav sticky top-0 z-50 min-h-nav-row border-b border-primary/10 bg-[hsl(220_14%_6%/0.72)] px-4 py-2 backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-page-marketing items-center justify-between gap-4">
        <Link to="/" className="vish-marketing-nav-brand flex items-center gap-3 no-underline">
          <span className="vish-marketing-nav-logo">
            <img src={OFFICIAL_LOGO_SRC} alt="Vishvakarma.OS" className="h-9 w-9 rounded-xl object-cover" />
          </span>
          <span className="vish-wordmark vish-marketing-nav-wordmark hidden text-sm font-bold sm:inline">
            VISHVAKARMA.OS
          </span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex" aria-label="Marketing">
          {navLinks}
          <span className="mx-2 h-5 w-px bg-primary/20" aria-hidden />
          <Button variant="gold" size="gold" asChild className="touch-target">
            <Link to={ctaTo} className="px-5 py-2.5 text-[0.65rem]">
              {ctaLabel}
            </Link>
          </Button>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="vish-marketing-nav-menu-btn touch-target h-11 w-11 rounded-xl md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="vish-sacred-stage w-72 border-l border-primary/20 p-0">
            <nav className="flex flex-col gap-1 p-6 pt-12" aria-label="Marketing mobile">
              <SheetClose asChild>
                <Link to="/features" className={cn(navLinkClass(pathname, '/features'), 'rounded-lg px-3 py-2.5')}>
                  Features
                </Link>
              </SheetClose>
              {PRICING_PAGE_ENABLED && (
                <SheetClose asChild>
                  <Link to="/pricing" className={cn(navLinkClass(pathname, '/pricing'), 'rounded-lg px-3 py-2.5')}>
                    Pricing
                  </Link>
                </SheetClose>
              )}
              <SheetClose asChild>
                <Button variant="gold" size="full" className="mt-4 text-[0.65rem]" asChild>
                  <Link to={ctaTo}>{ctaLabel}</Link>
                </Button>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
