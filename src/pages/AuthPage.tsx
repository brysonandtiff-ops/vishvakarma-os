import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, Download, Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCapabilities } from '@/hooks/useAuthCapabilities';
import { toast } from 'sonner';
import SanskritRainBackground from '@/components/common/SanskritRainBackground';

function getReturnPath(state: unknown) {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = String((state as { from: unknown }).from);
    return from.startsWith('/') ? from : '/editor';
  }

  return '/editor';
}

function getSignInHeadline(winner: 'email' | 'google' | 'none') {
  if (winner === 'google') {
    return 'Sign in with Google';
  }

  if (winner === 'email') {
    return 'Sign in with a secure email link';
  }

  return 'Sign-in temporarily unavailable';
}

function GoogleMarkIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const {
    user,
    loading,
    isConfigured,
    mode,
    emailLinkState,
    emailLinkError,
    requestAccessLink,
    completeEmailLinkSignIn,
    signInWithGoogle,
  } = useAuth();
  const { loading: capabilitiesLoading, winner } = useAuthCapabilities();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const returnPath = getReturnPath(location.state);
  const emailPreview = useMemo(() => email.trim().toLowerCase() || 'architect@firm.com', [email]);
  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !backendStatus.isConfigured;
  const allowLocalWorkspace = !isProduction && !isConfigured;
  const passwordResetNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    (location.state as { message: unknown }).message === 'password-reset-unavailable';
  const showEmailSignIn = !capabilitiesLoading && winner === 'email';
  const showGoogleSignIn = !capabilitiesLoading && winner === 'google';
  const showSignInUnavailable = !capabilitiesLoading && winner === 'none';
  const signInHeadline = getSignInHeadline(winner);

  const completingEmailLink = emailLinkState === 'completing';
  const needsEmailForLink = emailLinkState === 'needs_email';

  if (!loading && user) {
    return <Navigate to={returnPath} replace />;
  }

  const onCompleteEmailLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('Enter the same email address that received the secure access link.');
      return;
    }

    setSubmitting(true);
    const result = await completeEmailLinkSignIn(email);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    navigate(returnPath, { replace: true });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address to request a secure access link.');
      return;
    }

    setSubmitting(true);
    const result = await requestAccessLink(email);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage(`Secure access link sent to ${emailPreview}. Check your inbox, then return to Vishvakarma.OS.`);
  };

  const handleInstall = () => {
    toast.message('Install as App', {
      description: 'Use your browser menu (Add to Home Screen / Install app) to install Vishvakarma.OS.',
    });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    const result = await signInWithGoogle();
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.redirecting) {
      setMessage('Redirecting to Google…');
      return;
    }

    navigate(returnPath, { replace: true });
  };

  return (
    <main className="vish-auth-gate vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SanskritRainBackground preset="auth" className="pointer-events-none absolute inset-0" />

      <div className="vish-auth-aurora pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="vish-yantra-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="vish-mandala-aura pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="vish-mandala-ring vish-mandala-ring-outer" />
        <div className="vish-mandala-ring vish-mandala-ring-mid" />
        <div className="vish-mandala-ring vish-mandala-ring-inner" />
      </div>

      <div className="vish-auth-orb pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center justify-center gap-6 px-2">
        <div className="vish-auth-card-mockup w-full" data-testid="auth-mockup-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="vish-auth-logo-hero">
              <div className="vish-auth-logo-mandala" aria-hidden="true">
                <div className="vish-auth-logo-ring vish-auth-logo-ring-outer" />
                <div className="vish-auth-logo-ring vish-auth-logo-ring-inner" />
                <div className="vish-auth-logo-aura" />
              </div>
              <div className="vish-auth-logo-wrap">
                <img
                  src={OFFICIAL_LOGO_SRC}
                  alt="Vishvakarma.OS official user-supplied swan V logo"
                  className="vish-auth-logo-img"
                />
              </div>
            </div>
            <h1 className="vish-wordmark text-lg font-bold tracking-[0.28em] text-primary">VISHVAKARMA.OS</h1>
            <div className="vish-auth-wordmark-divider" aria-hidden="true" />
            <p className="mt-2 text-xs text-primary/70">iPad-Native Architecture Suite</p>
            <p className="mt-3 text-sm font-medium text-stone-100">{signInHeadline}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Firebase Cloud Save
              {isConfigured ? ' · Protected Workspace' : ' · Local Draft mode until configured'}
            </p>
          </div>

          {showConfigRequired && (
            <div className="mb-4 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Service configuration required</p>
                <p className="text-muted-foreground">
                  Production deploy is missing backend environment variables. Set Vercel vars per{' '}
                  <code className="rounded bg-muted px-1 text-xs">docs/release/VERCEL_ENV.md</code>.
                </p>
              </div>
            </div>
          )}

          {allowLocalWorkspace && (
            <div className="mb-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="font-semibold">Local workspace available</p>
                <p className="text-muted-foreground">
                  Auth is disabled until real Firebase environment variables are
                  configured. Current mode: {mode}.
                </p>
              </div>
            </div>
          )}

          {showSignInUnavailable && isConfigured && !showConfigRequired && (
            <div className="mb-4 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Sign-in unavailable</p>
                <p className="text-muted-foreground">
                  No verified sign-in method is available. See{' '}
                  <code className="rounded bg-muted px-1 text-xs">docs/release/evidence/auth-sign-in-proof.md</code>.
                </p>
              </div>
            </div>
          )}

          {completingEmailLink && showEmailSignIn && (
            <p role="status" className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-stone-200">
              Completing secure sign-in…
            </p>
          )}

          {needsEmailForLink && showEmailSignIn && (
            <div className="mb-4 flex gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-stone-100">Confirm your email to finish sign-in</p>
                <p className="text-muted-foreground">
                  This link was opened in a new browser or device. Enter the email address that received the secure
                  access link.
                </p>
              </div>
            </div>
          )}

          {(emailLinkError || error) && (
            <p role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {emailLinkError ?? error}
            </p>
          )}

          {showEmailSignIn && (
            <form onSubmit={needsEmailForLink ? onCompleteEmailLink : onSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="vish-bilingual-label">
                  Email <span>- ई-पत्र</span>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="architect@firm.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!isConfigured || submitting || showConfigRequired}
                  className="vish-mockup-input"
                />
              </label>

              <p className="text-[10px] leading-relaxed text-muted-foreground">
                No password required — we email you a one-time secure link to open the protected workspace.
              </p>

              {passwordResetNotice && (
                <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-stone-200">
                  Password reset is not available — request a new secure access link below instead.
                </p>
              )}

              {message && (
                <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="vish-gold-button"
                disabled={!isConfigured || submitting || showConfigRequired || completingEmailLink}
              >
                {needsEmailForLink
                  ? submitting
                    ? 'Completing sign-in…'
                    : 'Complete sign-in'
                  : submitting
                    ? 'Sending access link…'
                    : 'Send secure access link'}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() =>
                    toast.message('New account', {
                      description: 'Enter your email above — the same secure link creates your account on first sign-in.',
                    })
                  }
                >
                  New here? Use your email above
                </button>
              </p>

              {allowLocalWorkspace && (
                <button
                  type="button"
                  className="vish-oauth-button"
                  onClick={() => navigate('/editor')}
                >
                  Enter local workspace · स्थानीय कार्यस्थान
                </button>
              )}
            </form>
          )}

          {showGoogleSignIn && (
            <div className="space-y-4">
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Verified production sign-in — open your protected workspace with Google.
              </p>

              <button
                type="button"
                className="vish-gold-button vish-gold-button--with-icon"
                disabled={submitting || !isConfigured || showConfigRequired}
                onClick={() => void handleGoogleSignIn()}
              >
                <span className="vish-gold-button__icon">
                  <GoogleMarkIcon />
                </span>
                Continue with Google
              </button>

              {allowLocalWorkspace && (
                <button
                  type="button"
                  className="vish-oauth-button"
                  onClick={() => navigate('/editor')}
                >
                  Enter local workspace · स्थानीय कार्यस्थान
                </button>
              )}
            </div>
          )}

          <div className="vish-auth-card-footer">
            <button
              type="button"
              className="vish-auth-card-footer-link"
              onClick={() => navigate('/features')}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Explore features · विशेषताएँ
            </button>
            <button type="button" className="vish-auth-card-footer-link" onClick={handleInstall}>
              <Download className="h-3.5 w-3.5" />
              Install app · गृह-स्थापना
            </button>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2" data-testid="auth-trust-pillars">
          <div className="vish-auth-feature-card rounded-xl border border-primary/20 bg-card/30 p-3 text-center backdrop-blur-sm">
            <Shield className="mx-auto mb-2 h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-[11px] font-semibold text-foreground">
              {WORLD_RECORD_METRIC_GATE_COUNT}-gate release evidence system
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              In-repo pre-release gates enforced before ship — not a Guinness title claim.
            </p>
          </div>
          <div className="vish-auth-feature-card rounded-xl border border-primary/20 bg-card/30 p-3 text-center backdrop-blur-sm">
            <Trophy className="mx-auto mb-2 h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-[11px] font-semibold text-foreground">Self-Verified Candidate</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              World Records registry with SHA-256 proof — open after sign-in at /world-records.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
