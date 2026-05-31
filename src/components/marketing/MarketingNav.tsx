import { Link } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { useAuth } from '@/contexts/AuthContext';

export function MarketingNav() {
  const { user } = useAuth();
  const ctaTo = user ? '/editor' : '/auth';

  return (
    <header className="vish-marketing-nav sticky top-0 z-50 px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Vishvakarma.OS"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <span className="vish-wordmark text-sm font-bold tracking-[0.28em] text-stone-100">
            VISHVAKARMA.OS
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Marketing">
          <Link to="/features" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300 hover:text-primary">
            Features
          </Link>
          <Link to="/pricing" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300 hover:text-primary">
            Pricing
          </Link>
          <Link to={ctaTo} className="vish-gold-cta px-6 py-2.5 text-[0.65rem]">
            Start Free
          </Link>
        </nav>
        <Link to={ctaTo} className="vish-gold-cta md:hidden px-4 py-2 text-[0.6rem]">
          Start Free
        </Link>
      </div>
    </header>
  );
}
