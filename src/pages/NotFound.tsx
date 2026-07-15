import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import { useAuth } from '@/contexts/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const editorTo = user ? '/editor' : '/auth';

  return (
    <>
      <PageMeta title="Page not found — Vishvakarma.OS" description="That page doesn't exist. Head back to the studio." />
      <section className="vish-marketing-section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <MarketingPageHeader
          devanagari="मार्ग न लभते"
          title={<span className="text-7xl font-bold tracking-tight">404</span>}
          description="That page doesn't exist — it may have moved, or the link is mistyped."
        />
        <h1 className="sr-only">Page not found</h1>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button variant="gold" size="gold" asChild className="touch-target">
            <Link to="/">Return home</Link>
          </Button>
          <Button variant="goldOutline" size="gold" asChild className="touch-target">
            <Link to={editorTo}>Open editor</Link>
          </Button>
        </div>
        <nav className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-semibold text-primary" aria-label="Helpful destinations">
          <Link to="/features" className="touch-target inline-flex items-center underline-offset-4 hover:underline">Features & guides</Link>
          {PRICING_PAGE_ENABLED && (
            <Link to="/pricing" className="touch-target inline-flex items-center underline-offset-4 hover:underline">Pricing</Link>
          )}
        </nav>
      </section>
    </>
  );
}
