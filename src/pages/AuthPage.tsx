import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, Download, Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import '@/styles/vish-auth-gate.css';

const SANSKRIT_MATRIX_COLUMNS = [
  'ॐ श्री विश्वकर्मणे नमः',
  'धर्म अर्थ शिल्प विज्ञान',
  'मन्त्र यन्त्र वास्तु रचना',
  'ॐ ह्रीं क्लीं सौः',
  'विद्या कर्म ज्योति रूपम्',
  'स्थिरं सौन्दर्यम् शुभम्',
  'रचना प्रमाणं सुरक्षा',
  'सत्यं शिल्पं प्रकाशः',
] as const;

function getReturnPath(state: unknown) {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = String((state as { from: unknown }).from);
    return from.startsWith('/') ? from : '/editor';
  }

  return '/editor';
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
    }
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
    navigate(returnPath, { replace: true });
  };

  return (
    <main className="vish-auth-gate vish-dark-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="vish-sanskrit-matrix pointer-events-none absolute inset-0" aria-hidden="true">
        {SANSKRIT_MATRIX_COLUMNS.map((glyphs, index) => (
          <span
            key={glyphs}
            className="vish-sanskrit-column"
            style={{
              left: `${5 + index * 12.5}%`,
              animationDelay: `${index * -3.2}s`,
              animationDuration: `${18 + index * 2.4}s`,
            }}
          >
            {Array.from({ length: 9 }, (_, lineIndex) => (
              <span key={`${glyphs}-${lineIndex}`}>{glyphs}</span>
            ))}
          </span>
        ))}
      </div>

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
            <div className="vish-access-logo-shell vish-logo-tile-animated mb-4 flex h-20 w-20 items-center justify-center rounded-2xl p-2">
              <img
                src={OFFICIAL_LOGO_SRC}
                alt="Vishvakarma.OS official user-supplied swan V logo"
                className="vish-access-logo h-full w-full rounded-xl object-cover"
              />
            </div>
            <h1 className="vish-wordmark text-lg font-bold tracking-[0.28em] text-primary">VISHVAKARMA.OS</h1>
            <p className="mt-2 text-xs text-primary/70">iPad-Native Architecture Suite</p>
            <p className="mt-3 text-sm text-muted-foreground">Sign in with a secure email link</p>
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

          {completingEmailLink && (
            <p role="status" className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-stone-200">
              Completing secure sign-in…
            </p>
          )}

          {needsEmailForLink && (
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
              {' · '}
              <button type="button" className="text-primary hover:underline" onClick={() => navigate('/reset-password')}>
                Access help
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

          <p className="my-4 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Or
          </p>

          <button
            type="button"
            className="vish-oauth-button"
            disabled={submitting || !isConfigured}
            onClick={() => void handleGoogleSignIn()}
          >
            Continue with Google
          </button>

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 text-[11px] text-primary/70 hover:text-primary"
            onClick={() => navigate('/features')}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Explore all features &amp; guides · विशेषताएँ
          </button>

          <button type="button" className="vish-oauth-button mt-3" onClick={handleInstall}>
            <Download className="h-4 w-4 text-primary" />
            Install as App · गृह-स्थापना
          </button>
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
