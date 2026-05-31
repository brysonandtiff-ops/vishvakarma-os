import { Link } from 'react-router-dom';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-primary/20 px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={OFFICIAL_LOGO_SRC} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-xs font-bold tracking-[0.24em] text-stone-300">VISHVAKARMA.OS</span>
        </div>
        <nav className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          <Link to="/features" className="hover:text-primary">Features</Link>
          <Link to="/pricing" className="hover:text-primary">Pricing</Link>
          <Link to="/auth" className="hover:text-primary">Sign In</Link>
        </nav>
        <p className="text-xs text-stone-500">
          &copy; {new Date().getFullYear()} Vishvakarma.OS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
