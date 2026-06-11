import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Shield } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';

describe('AuthTrustPillar', () => {
  it('renders metric, badge, and destination with accessible naming', () => {
    render(
      <AuthTrustPillar
        icon={Shield}
        badge="Release evidence"
        title="12-Gate Release Evidence"
        description="Automated pre-release checks in-repo."
        metric="12"
        metricLabel="gates"
        destination="/releases"
        variant="gates"
        testId="auth-trust-pillar-gates"
        onLearnMore={() => undefined}
      />
    );

    const pillar = screen.getByTestId('auth-trust-pillar-gates');
    expect(pillar).toHaveClass('vish-auth-feature-card--gates');
    expect(pillar).toHaveAttribute('aria-labelledby');
    expect(pillar).toHaveAttribute('aria-describedby');
    expect(screen.getByText('12-Gate Release Evidence')).toBeInTheDocument();
    expect(screen.getByText('/releases')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('invokes learn-more handler on click', async () => {
    const user = userEvent.setup();
    const onLearnMore = vi.fn();

    render(
      <AuthTrustPillar
        icon={Shield}
        badge="Release evidence"
        title="12-Gate Release Evidence"
        description="Automated pre-release checks in-repo."
        testId="auth-trust-pillar-gates"
        onLearnMore={onLearnMore}
      />
    );

    await user.click(screen.getByTestId('auth-trust-pillar-gates'));
    expect(onLearnMore).toHaveBeenCalledOnce();
  });
});
