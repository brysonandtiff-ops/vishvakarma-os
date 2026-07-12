import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMfaStatus,
  verifyTotpFactor,
  type TotpFactor,
} from '@/backend/supabase/supabaseMfaGateway';

interface MfaChallengeGateProps {
  children: ReactNode;
}

type GateState =
  | { status: 'checking' }
  | { status: 'open'; factor: TotpFactor }
  | { status: 'clear' }
  | { status: 'error'; message: string };

export default function MfaChallengeGate({ children }: MfaChallengeGateProps) {
  const { user, signOut } = useAuth();
  const [gate, setGate] = useState<GateState>({ status: 'checking' });
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const inspect = useCallback(async () => {
    if (!user) {
      setGate({ status: 'clear' });
      return;
    }

    setGate({ status: 'checking' });
    try {
      const status = await getMfaStatus();
      const factor = status.verifiedTotpFactors[0];
      const needsChallenge =
        factor && status.nextLevel === 'aal2' && status.currentLevel !== 'aal2';
      setGate(needsChallenge ? { status: 'open', factor } : { status: 'clear' });
    } catch (cause) {
      setGate({
        status: 'error',
        message: cause instanceof Error ? cause.message : 'Unable to verify MFA status.',
      });
    }
  }, [user]);

  useEffect(() => {
    void inspect();
  }, [inspect]);

  const verify = async () => {
    if (gate.status !== 'open') return;
    setVerifying(true);
    setVerificationError(null);
    try {
      await verifyTotpFactor(gate.factor.id, code);
      setCode('');
      await inspect();
    } catch (cause) {
      setVerificationError(
        cause instanceof Error ? cause.message : 'The authenticator code was rejected.',
      );
    } finally {
      setVerifying(false);
    }
  };

  if (gate.status === 'clear') return <>{children}</>;

  if (gate.status === 'checking') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
        <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 animate-pulse text-primary" aria-hidden="true" />
          Checking account security…
        </div>
      </main>
    );
  }

  if (gate.status === 'error') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
        <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-xl">
          <h1 className="text-lg font-semibold">Account security check unavailable</h1>
          <p role="alert" className="text-sm text-destructive">{gate.message}</p>
          <div className="flex gap-2">
            <Button onClick={() => void inspect()}>Try again</Button>
            <Button variant="outline" onClick={() => void signOut()} className="gap-2">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
      <section
        aria-labelledby="mfa-challenge-title"
        className="w-full max-w-md space-y-5 rounded-xl border border-primary/30 bg-card p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h1 id="mfa-challenge-title" className="text-lg font-semibold">
              Authenticator verification
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-digit code for {gate.factor.friendlyName} to continue.
            </p>
          </div>
        </div>

        <label className="block text-sm font-medium">
          Verification code
          <Input
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && code.length === 6) void verify();
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            className="mt-2 font-mono text-lg tracking-[0.35em]"
          />
        </label>

        {verificationError && (
          <p role="alert" className="text-sm text-destructive">{verificationError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button disabled={verifying || code.length !== 6} onClick={() => void verify()}>
            {verifying ? 'Verifying…' : 'Verify'}
          </Button>
          <Button variant="outline" onClick={() => void signOut()} className="gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}
