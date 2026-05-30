import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

export default function NotFound() {
  return (
    <>
      <PageMeta title="Page Not Found" description="" />
      <main className="vish-auth-gate relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        <div className="vish-auth-card-mockup text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Vishvakarma.OS</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground text-pretty">
            The page may have been deleted or does not exist. Check the URL and return to the workspace.
          </p>
          <Link to="/" className="vish-gold-button mt-6 inline-flex w-auto px-8 no-underline">
            Back to editor
          </Link>
        </div>
        <p className="absolute bottom-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()}</p>
      </main>
    </>
  );
}
