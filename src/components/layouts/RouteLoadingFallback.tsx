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
          <SkeletonBar className="hidden w-72 shrink-0 tablet:block" />
        </div>
        <SkeletonBar className="h-8 w-full shrink-0 rounded-none bg-ws-statusbar/40" />
        <p className="sr-only">Loading editor…</p>
      </div>
    );
  }

  const isGovernance = variant === 'governance';

  return (
    <div className="vish-section-stack px-page-x py-page-y">
      <div className={cn('space-y-3 rounded-card-lg border border-border/40 p-card-md', isGovernance && 'bg-muted/20')}>
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-7 w-56 max-w-full" />
        <SkeletonBar className="h-4 w-80 max-w-full" />
        {isGovernance && (
          <div className="flex gap-2 pt-2">
            <SkeletonBar className="h-6 w-20 rounded-full" />
            <SkeletonBar className="h-6 w-24 rounded-full" />
          </div>
        )}
      </div>
      {isGovernance && <SkeletonBar className="h-10 w-full max-w-md" />}
      <div className={cn('grid gap-4', isGovernance ? 'tablet:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
        <SkeletonBar className={cn(isGovernance ? 'h-40' : 'h-32')} />
        <SkeletonBar className={cn(isGovernance ? 'h-40' : 'h-32')} />
        <SkeletonBar className={cn(isGovernance ? 'h-40' : 'h-32', !isGovernance && 'hidden sm:block')} />
      </div>
      <p className="sr-only">Loading workspace…</p>
    </div>
  );
}

export default RouteLoadingFallback;
