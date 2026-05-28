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
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">{this.props.title ?? 'Something went wrong'}</p>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.message || 'An unexpected rendering error occurred.'}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => this.setState({ hasError: false, message: '' })}>
          Try again
        </Button>
      </div>
    );
  }
}
