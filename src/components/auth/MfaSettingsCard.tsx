import { useCallback, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import WorkspacePanel from '@/components/common/WorkspacePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  enrollTotpFactor,
  getMfaStatus,
  unenrollTotpFactor,
  verifyTotpFactor,
  type MfaStatus,
  type TotpEnrollment,
} from '@/backend/supabase/supabaseMfaGateway';

export default function MfaSettingsCard() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setStatus(await getMfaStatus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read MFA status.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const beginEnrollment = async () => {
    setBusy(true);
    setError(null);
    try {
      setEnrollment(await enrollTotpFactor());
      setCode('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start MFA enrollment.');
    } finally {
      setBusy(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollment) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTotpFactor(enrollment.factorId, code);
      setEnrollment(null);
      setCode('');
      await refresh();
      toast.success('Authenticator MFA enabled');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The verification code was rejected.');
    } finally {
      setBusy(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    if (!window.confirm('Remove this authenticator factor?')) return;
    setBusy(true);
    setError(null);
    try {
      await unenrollTotpFactor(factorId);
      await refresh();
      toast.success('Authenticator factor removed');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove the factor.');
    } finally {
      setBusy(false);
    }
  };

  const cancelEnrollment = async () => {
    if (!enrollment) return;
    setBusy(true);
    try {
      await unenrollTotpFactor(enrollment.factorId);
    } catch {
      // An unverified factor may already have expired; clearing local setup state is safe.
    } finally {
      setEnrollment(null);
      setCode('');
      setBusy(false);
    }
  };

  return (
    <WorkspacePanel
      title="Account security"
      description="Add an authenticator app as a phishing-resistant second step after Google SSO."
      tone="light"
      padded
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Authenticator app (TOTP)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {status?.verifiedTotpFactors.length
                ? `${status.verifiedTotpFactors.length} verified factor${status.verifiedTotpFactors.length === 1 ? '' : 's'} · current session ${status.currentLevel ?? 'unknown'}`
                : 'No verified authenticator factor is enrolled.'}
            </p>
          </div>
        </div>

        {status?.verifiedTotpFactors.map((factor) => (
          <div
            key={factor.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/50 p-3"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm text-foreground">{factor.friendlyName}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void removeFactor(factor.id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
        ))}

        {!enrollment && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void beginEnrollment()}
          >
            {busy ? 'Preparing…' : 'Add authenticator app'}
          </Button>
        )}

        {enrollment && (
          <div className="space-y-4 rounded-xl border border-primary/30 bg-background/70 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Scan this QR code</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use Google Authenticator, 1Password, Authy, or another TOTP app, then enter its 6-digit code.
              </p>
            </div>
            <img
              src={enrollment.qrCode}
              alt="Authenticator enrollment QR code"
              className="h-48 w-48 rounded-lg bg-white p-2"
            />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Cannot scan?</summary>
              <p className="mt-2 break-all font-mono" aria-label="Authenticator secret">
                {enrollment.secret}
              </p>
            </details>
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-48 flex-1 text-xs font-medium text-foreground">
                Verification code
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="mt-1 font-mono tracking-[0.3em]"
                />
              </label>
              <Button disabled={busy || code.length !== 6} onClick={() => void verifyEnrollment()}>
                Verify and enable
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void cancelEnrollment()}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Phone MFA remains disabled because it requires a paid SMS provider and a separate recovery policy.
        </p>
      </div>
    </WorkspacePanel>
  );
}
