import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const editorTo = user ? '/editor' : '/auth';

  return (
    <MarketingLayout>
      <PageMeta title="404 — Not Found" description="This Vishvakarma.OS route does not exist." />
      <section className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <MarketingPageHeader
          devanagari="मार्ग न लभते"
          title={<span className="text-7xl font-bold tracking-tight">404</span>}
          description="This path is not part of the Vishvakarma.OS workspace manifest."
        />
        <h1 className="sr-only">Route not found</h1>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/" className="vish-gold-cta">
            Return home
          </Link>
          <Link to={editorTo} className="vish-gold-cta-outline">
            Open editor
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
