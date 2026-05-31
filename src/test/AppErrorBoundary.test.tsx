import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

function ThrowingChild(): never {
  throw new Error('Test render failure');
}

describe('AppErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AppErrorBoundary>
        <p>Child ok</p>
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Child ok')).toBeInTheDocument();
  });

  it('shows recovery UI when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AppErrorBoundary title="Editor failed">
        <ThrowingChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Editor failed')).toBeInTheDocument();
    expect(screen.getByText('Test render failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
