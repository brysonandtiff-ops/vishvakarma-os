import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import AppLayout from '@/components/layouts/AppLayout';
import WorkspacePageShell from '@/components/layouts/WorkspacePageShell';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { useAuth } from '@/contexts/AuthContext';

/** Wildcard 404 — workspace chrome when signed in, marketing when public. */
export default function AuthAwareNotFound() {
  const { user } = useAuth();
  const editorTo = user ? '/editor' : '/auth';

  if (user) {
    return (
      <AppLayout>
        <PageMeta title="404 — Not Found" description="This Vishvakarma.OS route does not exist." />
        <WorkspacePageShell width="standard">
          <WorkspacePageHeader
            zone="document"
            eyebrow="Workspace"
            title="Route not found"
            description="This path is not part of the Vishvakarma.OS workspace manifest."
            actions={
              <>
                <Button asChild className="touch-target">
                  <Link to="/projects">Projects</Link>
                </Button>
                <Button variant="outline" asChild className="touch-target">
                  <Link to={editorTo}>Open editor</Link>
                </Button>
              </>
            }
          />
        </WorkspacePageShell>
      </AppLayout>
    );
  }

  return (
    <MarketingLayout>
      <PageMeta title="404 — Not Found" description="This Vishvakarma.OS route does not exist." />
      <section className="vish-marketing-section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <MarketingPageHeader
          devanagari="मार्ग न लभते"
          title={<span className="text-7xl font-bold tracking-tight">404</span>}
          description="This path is not part of the Vishvakarma.OS workspace manifest."
        />
        <h1 className="sr-only">Route not found</h1>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button variant="gold" size="gold" asChild>
            <Link to="/">Return home</Link>
          </Button>
          <Button variant="goldOutline" size="gold" asChild>
            <Link to={editorTo}>Open editor</Link>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
