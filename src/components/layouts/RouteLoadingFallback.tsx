import { cn } from '@/lib/utils';

type LoadingVariant = 'marketing' | 'auth' | 'workspace' | 'governance' | 'editor';

interface RouteLoadingFallbackProps {
  variant?: LoadingVariant;
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted/60', className)} aria-hidden="true" />;
}

export function RouteLoadingFallback({ variant = 'workspace' }: RouteLoadingFallbackProps) {
  if (variant === 'marketing' || variant === 'auth') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16">
        <SkeletonBar className="h-10 w-10 rounded-2xl" />
        <SkeletonBar className="h-4 w-48" />
        <SkeletonBar className="h-3 w-64 max-w-full" />
        <p className="sr-only">Loading page…</p>
      </div>
    );
  }

  if (variant === 'editor') {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-ws-canvas">
        <SkeletonBar className="h-12 w-full shrink-0 rounded-none bg-ws-toolbar/40" />
        <div className="flex flex-1 gap-2 p-2">
          <SkeletonBar className="hidden w-16 shrink-0 tablet:block" />
          <SkeletonBar className="min-h-[200px] flex-1" />
        </div>
        <p className="sr-only">Loading editor…</p>
      </div>
    );
  }

  return (
    <div className="vish-section-stack px-page-x py-page-y">
      <div className="space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-7 w-56 max-w-full" />
        <SkeletonBar className="h-4 w-80 max-w-full" />
      </div>
      <div className={cn('grid gap-4', variant === 'governance' ? 'tablet:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
        <SkeletonBar className="h-32" />
        <SkeletonBar className="h-32" />
        <SkeletonBar className="h-32" />
      </div>
      <p className="sr-only">Loading workspace…</p>
    </div>
  );
}

export default RouteLoadingFallback;
