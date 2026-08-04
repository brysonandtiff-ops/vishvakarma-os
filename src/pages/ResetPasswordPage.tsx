import { useEffect, useState } from 'react';
import { KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';
import {
  MIN_ACCOUNT_PASSWORD_LENGTH,
  getSupabaseRecoverySession,
  sendSupabasePasswordRecovery,
  signOutAfterPasswordRecovery,
  updateSupabaseAccountPassword,
  validateAccountPassword,
} from '@/backend/supabase/supabaseAccountLifecycle';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();

    const refresh = async () => {
      try {
        const session = await getSupabaseRecoverySession();
        if (mounted) setHasRecoverySession(Boolean(session));
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not inspect the recovery session.');
        }
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    void refresh();
    const listener = client?.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(Boolean(session));
        setCheckingSession(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  const requestRecovery = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      await sendSupabasePasswordRecovery(
        email,
        `${window.location.origin}/reset-password`,
      );
      setMessage(
        'Recovery email sent. Open the newest link in that email to choose a new password.',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the recovery email.');
    } finally {
      setSubmitting(false);
    }
  };

  const updatePassword = async () => {
    try {
      const passwordError = validateAccountPassword(password);
      if (passwordError) throw new Error(passwordError);
      if (password !== confirmPassword) {
        throw new Error('The two passwords do not match.');
      }

      setSubmitting(true);
      setError(null);
      setMessage(null);
      await updateSupabaseAccountPassword(password);
      await signOutAfterPasswordRecovery();
      setPassword('');
      setConfirmPassword('');
      navigate('/auth', {
        replace: true,
        state: { message: 'password-reset-complete' },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Password Recovery — Vishvakarma.OS"
        description="Recover and update a Vishvakarma.OS Supabase account password."
      />
      <main className="min-h-screen bg-background px-4 py-16" data-testid="reset-password-page">
        <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card/90 p-6 shadow-2xl">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
            data-testid="reset-supabase-badge"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Supabase Recovery • Connected
          </div>

          <h1 className="text-2xl font-semibold">
            {hasRecoverySession ? 'Choose a new password' : 'Recover your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasRecoverySession
              ? 'Your recovery link has been verified by Supabase.'
              : 'Enter your account email and Supabase will send a secure recovery link.'}
          </p>

          {checkingSession ? (
            <p className="mt-6 text-sm" role="status">Checking the recovery session…</p>
          ) : hasRecoverySession ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void updatePassword();
              }}
            >
              <label className="block text-sm font-medium" htmlFor="new-password">
                New password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2" size={16} aria-hidden="true" />
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={MIN_ACCOUNT_PASSWORD_LENGTH}
                  className="w-full rounded-lg border border-white/10 bg-background px-10 py-3"
                  data-testid="recovery-new-password-input"
                  required
                />
              </div>

              <label className="block text-sm font-medium" htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2" size={16} aria-hidden="true" />
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={MIN_ACCOUNT_PASSWORD_LENGTH}
                  className="w-full rounded-lg border border-white/10 bg-background px-10 py-3"
                  data-testid="recovery-confirm-password-input"
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Use {MIN_ACCOUNT_PASSWORD_LENGTH}+ characters with upper- and lowercase letters and a number.
              </p>

              <button
                type="submit"
                className="touch-target flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
                disabled={submitting}
                data-testid="recovery-update-password-button"
              >
                <KeyRound size={18} aria-hidden="true" />
                {submitting ? 'Updating password…' : 'Update password'}
              </button>
            </form>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void requestRecovery();
              }}
            >
              <label className="block text-sm font-medium" htmlFor="recovery-email">
                Account email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} aria-hidden="true" />
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-background px-10 py-3"
                  data-testid="recovery-email-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="touch-target flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
                disabled={submitting}
                data-testid="recovery-send-email-button"
              >
                <Mail size={18} aria-hidden="true" />
                {submitting ? 'Sending recovery email…' : 'Send recovery email'}
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
          {message && <p className="mt-4 text-sm text-emerald-300" role="status">{message}</p>}

          <button
            type="button"
            className="touch-target mt-6 w-full text-sm underline underline-offset-4"
            onClick={() => navigate('/auth')}
          >
            Back to sign in
          </button>
        </section>
      </main>
    </>
  );
}
