import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MfaChallengeGate from '@/components/auth/MfaChallengeGate';

const mocks = vi.hoisted(() => ({
  auth: {
    user: { id: 'user-1', email: 'architect@firm.com' } as { id: string; email: string } | null,
    signOut: vi.fn(),
    isConfigured: true,
    mode: 'connected' as 'connected' | 'local-only',
  },
  getMfaStatus: vi.fn(),
  verifyTotpFactor: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('@/backend/supabase/supabaseMfaGateway', () => ({
  getMfaStatus: mocks.getMfaStatus,
  verifyTotpFactor: mocks.verifyTotpFactor,
}));

describe('MfaChallengeGate', () => {
  beforeEach(() => {
    mocks.auth.user = { id: 'user-1', email: 'architect@firm.com' };
    mocks.auth.isConfigured = true;
    mocks.auth.mode = 'connected';
    mocks.auth.signOut.mockReset();
    mocks.getMfaStatus.mockReset();
    mocks.verifyTotpFactor.mockReset();
  });

  it('shows signed-out public content immediately without MFA waiting', () => {
    mocks.auth.user = null;

    render(
      <MfaChallengeGate>
        <h1>Public home</h1>
      </MfaChallengeGate>,
    );

    expect(screen.getByRole('heading', { name: 'Public home' })).toBeInTheDocument();
    expect(screen.queryByText('Checking account security…')).not.toBeInTheDocument();
    expect(mocks.getMfaStatus).not.toHaveBeenCalled();
  });

  it('keeps a signed-in workspace hidden while the MFA check is pending', () => {
    mocks.getMfaStatus.mockImplementation(() => new Promise(() => {}));

    render(
      <MfaChallengeGate>
        <div>Protected workspace</div>
      </MfaChallengeGate>,
    );

    expect(screen.getByText('Checking account security…')).toBeInTheDocument();
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  });

  it('rechecks MFA when the signed-in account changes', async () => {
    mocks.getMfaStatus.mockResolvedValueOnce({
      currentLevel: 'aal1',
      nextLevel: 'aal1',
      verifiedTotpFactors: [],
    });

    const { rerender } = render(
      <MfaChallengeGate>
        <div>Private project</div>
      </MfaChallengeGate>,
    );
    expect(await screen.findByText('Private project')).toBeInTheDocument();

    mocks.auth.user = { id: 'user-2', email: 'other@firm.com' };
    mocks.getMfaStatus.mockImplementation(() => new Promise(() => {}));
    rerender(
      <MfaChallengeGate>
        <div>Private project</div>
      </MfaChallengeGate>,
    );

    expect(screen.getByText('Checking account security…')).toBeInTheDocument();
    expect(screen.queryByText('Private project')).not.toBeInTheDocument();
  });

  it('bypasses hosted MFA checks for local sessions', async () => {
    mocks.auth.mode = 'local-only';

    render(
      <MfaChallengeGate>
        <div>Workspace</div>
      </MfaChallengeGate>,
    );

    expect(await screen.findByText('Workspace')).toBeInTheDocument();
    expect(mocks.getMfaStatus).not.toHaveBeenCalled();
  });

  it('challenges an enrolled AAL1 session and clears after verification', async () => {
    mocks.getMfaStatus
      .mockResolvedValueOnce({
        currentLevel: 'aal1',
        nextLevel: 'aal2',
        verifiedTotpFactors: [
          { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
        ],
      })
      .mockResolvedValueOnce({
        currentLevel: 'aal2',
        nextLevel: 'aal2',
        verifiedTotpFactors: [
          { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
        ],
      });
    mocks.verifyTotpFactor.mockResolvedValue(undefined);

    render(
      <MfaChallengeGate>
        <div>Workspace</div>
      </MfaChallengeGate>,
    );

    const input = await screen.findByLabelText('Verification code');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(mocks.verifyTotpFactor).toHaveBeenCalledWith('factor-1', '123456');
      expect(screen.getByText('Workspace')).toBeInTheDocument();
    });
  });

  it('fails closed when the MFA status cannot be verified', async () => {
    mocks.getMfaStatus.mockRejectedValue(new Error('MFA service unavailable'));

    render(
      <MfaChallengeGate>
        <div>Workspace</div>
      </MfaChallengeGate>,
    );

    expect(await screen.findByText('Account security check unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });
});
