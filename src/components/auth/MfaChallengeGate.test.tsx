import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MfaChallengeGate from '@/components/auth/MfaChallengeGate';
import type { AuthSession } from '@/contexts/authContextTypes';
import type { MfaStatus } from '@/backend/supabase/supabaseMfaGateway';

const mocks = vi.hoisted(() => ({
  auth: {
    user: { id: 'user-1', email: 'architect@firm.com' } as { id: string; email: string } | null,
    session: null as AuthSession | null,
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
    mocks.auth.session = {
      provider: 'supabase',
      authProvider: 'google',
      uid: 'user-1',
      email: 'architect@firm.com',
      expiresAt: 1_800_000_000_000,
    };
    mocks.auth.isConfigured = true;
    mocks.auth.mode = 'connected';
    mocks.auth.signOut.mockReset();
    mocks.getMfaStatus.mockReset();
    mocks.verifyTotpFactor.mockReset();
  });

  it('shows signed-out public content immediately without MFA waiting', () => {
    mocks.auth.user = null;
    mocks.auth.session = null;

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

  it('requires fresh assurance when the same account receives a replacement session', async () => {
    let resolveReplacement!: (status: MfaStatus) => void;
    mocks.getMfaStatus
      .mockResolvedValueOnce({
        currentLevel: 'aal2',
        nextLevel: 'aal2',
        verifiedTotpFactors: [
          { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
        ],
      })
      .mockImplementationOnce(() => new Promise<MfaStatus>((resolve) => {
        resolveReplacement = resolve;
      }));

    const { rerender } = render(
      <MfaChallengeGate><div>Private project</div></MfaChallengeGate>,
    );
    expect(await screen.findByText('Private project')).toBeInTheDocument();

    // Auth events create fresh snapshots even when the account and expiry match.
    mocks.auth.session = { ...mocks.auth.session! };
    mocks.auth.user = { ...mocks.auth.user! };
    rerender(<MfaChallengeGate><div>Private project</div></MfaChallengeGate>);

    expect(screen.queryByText('Private project')).not.toBeInTheDocument();
    expect(screen.getByText('Checking account security…')).toBeInTheDocument();
    await act(async () => resolveReplacement({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      verifiedTotpFactors: [
        { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
      ],
    }));
    expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
    expect(screen.queryByText('Private project')).not.toBeInTheDocument();
  });

  it('ignores an earlier session check that completes while its replacement is pending', async () => {
    let resolveEarlier!: (status: MfaStatus) => void;
    let resolveReplacement!: (status: MfaStatus) => void;
    mocks.getMfaStatus
      .mockImplementationOnce(() => new Promise<MfaStatus>((resolve) => {
        resolveEarlier = resolve;
      }))
      .mockImplementationOnce(() => new Promise<MfaStatus>((resolve) => {
        resolveReplacement = resolve;
      }));

    const { rerender } = render(
      <MfaChallengeGate><div>Private project</div></MfaChallengeGate>,
    );
    mocks.auth.session = { ...mocks.auth.session! };
    rerender(<MfaChallengeGate><div>Private project</div></MfaChallengeGate>);

    await act(async () => resolveEarlier({
      currentLevel: 'aal2', nextLevel: 'aal2', verifiedTotpFactors: [],
    }));
    expect(screen.queryByText('Private project')).not.toBeInTheDocument();
    expect(screen.getByText('Checking account security…')).toBeInTheDocument();

    await act(async () => resolveReplacement({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      verifiedTotpFactors: [
        { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
      ],
    }));
    expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
  });

  it('keeps replacement-session MFA required after an old verification completes', async () => {
    let resolveVerification!: () => void;
    const challenge: MfaStatus = {
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      verifiedTotpFactors: [
        { id: 'factor-1', friendlyName: 'Primary authenticator', status: 'verified' },
      ],
    };
    mocks.getMfaStatus
      .mockResolvedValueOnce(challenge)
      .mockResolvedValueOnce(challenge)
      .mockResolvedValue({ currentLevel: 'aal2', nextLevel: 'aal2', verifiedTotpFactors: [] });
    mocks.verifyTotpFactor.mockImplementationOnce(() => new Promise<void>((resolve) => {
      resolveVerification = resolve;
    }));

    const { rerender } = render(
      <MfaChallengeGate><div>Private project</div></MfaChallengeGate>,
    );
    fireEvent.change(await screen.findByLabelText('Verification code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    mocks.auth.session = { ...mocks.auth.session! };
    rerender(<MfaChallengeGate><div>Private project</div></MfaChallengeGate>);

    expect(await screen.findByLabelText('Verification code')).toHaveValue('');
    await act(async () => resolveVerification());
    expect(screen.getByLabelText('Verification code')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
    expect(screen.queryByText('Private project')).not.toBeInTheDocument();
  });

  it('does not repeat a completed check for rerenders of the same session', async () => {
    mocks.getMfaStatus.mockResolvedValueOnce({
      currentLevel: 'aal2', nextLevel: 'aal2', verifiedTotpFactors: [],
    });
    const { rerender } = render(
      <MfaChallengeGate><div>Private project</div></MfaChallengeGate>,
    );
    expect(await screen.findByText('Private project')).toBeInTheDocument();

    mocks.getMfaStatus.mockImplementation(() => new Promise(() => {}));
    mocks.auth.user = { ...mocks.auth.user! };
    rerender(<MfaChallengeGate><div>Updated private project</div></MfaChallengeGate>);

    expect(screen.getByText('Updated private project')).toBeInTheDocument();
    expect(screen.queryByText('Checking account security…')).not.toBeInTheDocument();
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
