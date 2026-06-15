import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const editorTo = user ? '/editor' : '/auth';

  return (
    <>
      <PageMeta title="404 — Not Found" description="This Vishvakarma.OS route does not exist." />
      <section className="vish-marketing-section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <MarketingPageHeader
          devanagari="मार्ग न लभते"
          title={<span className="text-7xl font-bold tracking-tight">404</span>}
          description="This path is not part of the Vishvakarma.OS workspace manifest."
        />
        <h1 className="sr-only">Route not found</h1>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button variant="gold" size="gold" asChild className="touch-target">
            <Link to="/">Return home</Link>
          </Button>
          <Button variant="goldOutline" size="gold" asChild className="touch-target">
            <Link to={editorTo}>Open editor</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
