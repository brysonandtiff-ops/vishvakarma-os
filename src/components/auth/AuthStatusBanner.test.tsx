import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthStatusBanner from '@/components/auth/AuthStatusBanner';

describe('AuthStatusBanner', () => {
  it('renders titled error banners as alerts with assertive live region', () => {
    render(
      <AuthStatusBanner variant="error" title="Sign-in unavailable" role="alert">
        Try again later.
      </AuthStatusBanner>
    );

    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner).toHaveAttribute('data-variant', 'error');
    expect(screen.getByText('Sign-in unavailable')).toBeInTheDocument();
    expect(screen.getByText('Try again later.')).toBeInTheDocument();
  });

  it('uses success and info icons for non-error variants', () => {
    const { rerender } = render(
      <AuthStatusBanner variant="success">Access link sent.</AuthStatusBanner>
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'success');

    rerender(
      <AuthStatusBanner variant="info" loading>
        Loading sign-in options…
      </AuthStatusBanner>
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'info');
    expect(document.querySelector('.vish-auth-status__icon--spin')).toBeTruthy();
  });

  it('exposes test id and accent structure for styling hooks', () => {
    render(
      <AuthStatusBanner variant="warning" data-testid="auth-embedded-browser-warning">
        Embedded browser warning
      </AuthStatusBanner>
    );

    expect(screen.getByTestId('auth-embedded-browser-warning')).toBeInTheDocument();
    expect(document.querySelector('.vish-auth-status__accent')).toBeTruthy();
  });
});
