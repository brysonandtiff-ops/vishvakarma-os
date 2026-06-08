import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Vishvakarma.OS] UI error boundary caught:', error, info.componentStack);
    void import('@/lib/monitoring').then(({ captureException }) => {
      captureException(error, { componentStack: info.componentStack ?? '' });
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="vish-auth-card-mockup mx-auto flex min-h-[240px] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-primary">{this.props.title ?? 'Something went wrong'}</p>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.message || 'An unexpected rendering error occurred.'}</p>
        </div>
        <Button type="button" variant="outline" className="border-primary/30" onClick={() => this.setState({ hasError: false, message: '' })}>
          Try again
        </Button>
      </div>
    );
  }
}
