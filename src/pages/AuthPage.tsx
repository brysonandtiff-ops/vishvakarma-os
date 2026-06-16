import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Copy, Download, ExternalLink, Shield, Trophy } from 'lucide-react';
import { WORLD_RECORD_METRIC_GATE_COUNT } from '@/governance/gates/releaseGateManifest';
import { WORLD_RECORD_HONESTY_DISCLAIMER } from '@/governance/records/worldRecordRegistry';
import { backendStatus } from '@/backend/backendConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCapabilities } from '@/hooks/useAuthCapabilities';
import { toast } from 'sonner';
import {
  getAuthPageUrl,
  getEmbeddedAuthBrowserLabel,
  isEmbeddedAuthBrowser,
  isEmbeddedAuthErrorMessage,
} from '@/backend/authUiHelpers';
import {
  POST_AUTH_DESTINATION,
  storeAuthReturnPath,
} from '@/backend/supabase/supabaseOAuthGateway';
import AuthGoogleButton from '@/components/auth/AuthGoogleButton';
import AuthSignInHeader from '@/components/auth/AuthSignInHeader';
import AuthStatusBanner from '@/components/auth/AuthStatusBanner';
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getSignInHeadline(winner: 'email' | 'google' | 'none') {
  if (winner === 'google') {
    return 'Sign in with Google';
  }

  if (winner === 'email') {
    return 'Sign in with a secure email link';
  }

  return 'Sign-in temporarily unavailable';
}

function getSignInHelperLine(winner: 'email' | 'google' | 'none') {
  if (winner === 'google') {
    return 'Open your protected workspace with a verified Google account.';
  }

  if (winner === 'email') {
    return 'We email a one-time secure link — no password stored.';
  }

  return 'Sign-in methods are being verified.';
}

export default function AuthPage() {
  const {
    user,
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
  const emailPreview = useMemo(() => email.trim().toLowerCase() || 'architect@firm.com', [email]);
  const isProduction = import.meta.env.PROD;
  const showConfigRequired = isProduction && !backendStatus.isConfigured;
  const allowLocalWorkspace = !isProduction && !isConfigured;
  const passwordResetNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    (location.state as { message: unknown }).message === 'password-reset-unavailable';
  const sessionRestoreTimeoutNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    (location.state as { message: unknown }).message === 'session-restore-timeout';
  const showEmailSignIn = !capabilitiesLoading && winner === 'email';
  const showGoogleSignIn = !capabilitiesLoading && winner === 'google';
  const showSignInUnavailable = !capabilitiesLoading && winner === 'none';
  const signInHeadline = getSignInHeadline(winner);
  const signInHelperLine = getSignInHelperLine(winner);
  const workspaceStatusLabel = isConfigured ? 'Protected Workspace' : 'Local Draft';
  const embeddedAuthBrowser = useMemo(
    () => typeof navigator !== 'undefined' && isEmbeddedAuthBrowser(),
    []
  );
  const embeddedBrowserLabel = useMemo(
    () => (typeof navigator !== 'undefined' ? getEmbeddedAuthBrowserLabel() : 'embedded browser'),
    []
  );
  const externalAuthUrl = useMemo(() => getAuthPageUrl(), []);
  const showEmbeddedAuthRecovery =
    embeddedAuthBrowser || Boolean((emailLinkError ?? error) && isEmbeddedAuthErrorMessage(emailLinkError ?? error ?? ''));

  const completingEmailLink = emailLinkState === 'completing';
  const needsEmailForLink = emailLinkState === 'needs_email';

  if (user) {
    return <Navigate to={POST_AUTH_DESTINATION} replace />;
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

    navigate(POST_AUTH_DESTINATION, { replace: true });
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

  const handleCopyAuthUrl = async () => {
    try {
      await navigator.clipboard.writeText(externalAuthUrl);
      toast.success('Sign-in link copied', {
        description: 'Paste into Chrome or Safari to complete Google sign-in.',
      });
    } catch {
      toast.message('Copy this URL', { description: externalAuthUrl });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    storeAuthReturnPath(POST_AUTH_DESTINATION);
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

    navigate(POST_AUTH_DESTINATION, { replace: true });
  };

  const hasStatusBanners =
    showConfigRequired ||
    allowLocalWorkspace ||
    (showSignInUnavailable && isConfigured && !showConfigRequired) ||
    (completingEmailLink && showEmailSignIn) ||
    (needsEmailForLink && showEmailSignIn) ||
    Boolean(emailLinkError || error) ||
    passwordResetNotice ||
    sessionRestoreTimeoutNotice ||
    (showGoogleSignIn && embeddedAuthBrowser);

  return (
    <>
        <div className="vish-auth-card-mockup vish-page-enter w-full" data-testid="auth-mockup-card">
          <AuthSignInHeader
            capabilitiesLoading={capabilitiesLoading}
            signInHeadline={signInHeadline}
            signInHelperLine={signInHelperLine}
            isConfigured={isConfigured}
            workspaceStatusLabel={workspaceStatusLabel}
          />

          {hasStatusBanners && (
            <div className="vish-auth-status-stack" role="group" aria-label="Sign-in status">
          {showConfigRequired && (
            <AuthStatusBanner variant="error" title="Service configuration required" role="alert">
              Production deploy is missing backend environment variables. Set Vercel vars per{' '}
              <code className="rounded bg-muted px-1 text-xs">docs/release/VERCEL_ENV.md</code>.
            </AuthStatusBanner>
          )}

          {allowLocalWorkspace && (
            <AuthStatusBanner variant="warning" title="Local workspace available">
              Auth is disabled until real Supabase environment variables are configured. Current mode: {mode}.
            </AuthStatusBanner>
          )}

          {showSignInUnavailable && isConfigured && !showConfigRequired && (
            <AuthStatusBanner variant="error" title="Sign-in unavailable" role="alert">
              No verified sign-in method is available. See{' '}
              <code className="rounded bg-muted px-1 text-xs">docs/release/evidence/auth-sign-in-proof.md</code>.
            </AuthStatusBanner>
          )}

          {completingEmailLink && showEmailSignIn && (
            <AuthStatusBanner variant="info" loading>
              Completing secure sign-in…
            </AuthStatusBanner>
          )}

          {needsEmailForLink && showEmailSignIn && (
            <AuthStatusBanner variant="info" title="Confirm your email to finish sign-in">
              This link was opened in a new browser or device. Enter the email address that received the secure access
              link.
            </AuthStatusBanner>
          )}

          {(emailLinkError || error) && (
            <AuthStatusBanner variant="error" role="alert" className="vish-auth-status--compact">
              {emailLinkError ?? error}
            </AuthStatusBanner>
          )}

          {passwordResetNotice && (
            <AuthStatusBanner variant="info" data-testid="auth-password-reset-notice">
              Password reset is not available — request a new secure access link below instead.
            </AuthStatusBanner>
          )}

          {sessionRestoreTimeoutNotice && (
            <AuthStatusBanner variant="warning" role="alert" data-testid="auth-session-restore-timeout">
              Your saved session could not be restored. Sign in again with Google to continue.
            </AuthStatusBanner>
          )}

          {showGoogleSignIn && embeddedAuthBrowser && (
            <AuthStatusBanner
              variant="warning"
              title="OAuth blocked in embedded browser"
              role="alert"
              data-testid="auth-embedded-browser-warning"
            >
              Google sign-in cannot run inside {embeddedBrowserLabel}. Open this page in Chrome or Safari, allow
              cookies for this site, then sign in.
            </AuthStatusBanner>
          )}
            </div>
          )}

          <section className="vish-auth-actions" aria-label="Sign-in actions">
          {showEmailSignIn && (
            <form onSubmit={needsEmailForLink ? onCompleteEmailLink : onSubmit} className="vish-auth-form space-y-3">
              <label className="block space-y-1">
                <span className="vish-bilingual-label">
                  Email <span>- ई-पत्र</span>
                </span>
                <Input
                  type="email"
                  variant="workstation"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="architect@firm.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!isConfigured || submitting || showConfigRequired}
                  aria-describedby="auth-email-helper"
                />
              </label>

              <p id="auth-email-helper" className="vish-auth-form-helper">
                No password required — we email you a one-time secure link to open the protected workspace.
              </p>

              {message && (
                <AuthStatusBanner variant="success" className="vish-auth-status--inline">
                  {message}
                </AuthStatusBanner>
              )}

              <Button
                type="submit"
                variant="gold"
                size="full"
                className="touch-target"
                disabled={!isConfigured || submitting || showConfigRequired || completingEmailLink}
              >
                {needsEmailForLink
                  ? submitting
                    ? 'Completing sign-in…'
                    : 'Complete sign-in'
                  : submitting
                    ? 'Sending access link…'
                    : 'Send secure access link'}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                <button
                  type="button"
                  className="vish-auth-inline-link"
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
            <div className="vish-auth-form space-y-3">
              {showEmbeddedAuthRecovery && (
                <div className="vish-auth-embedded-recovery" data-testid="auth-open-in-browser-cta">
                  <p className="vish-auth-embedded-recovery__title">Open in your system browser</p>
                  <p className="vish-auth-embedded-recovery__body">
                    Google OAuth is blocked here. Use Chrome or Safari for a one-time sign-in, then return to the app.
                  </p>
                  <div className="vish-auth-embedded-recovery__actions">
                    <a
                      href={externalAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vish-auth-open-browser-btn"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Open in Chrome or Safari
                    </a>
                    <button type="button" className="vish-auth-copy-url-btn" onClick={() => void handleCopyAuthUrl()}>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Copy URL
                    </button>
                  </div>
                </div>
              )}

              {message && (
                <AuthStatusBanner variant="info" loading className="vish-auth-status--inline">
                  {message}
                </AuthStatusBanner>
              )}

              <AuthGoogleButton
                submitting={submitting}
                disabled={!isConfigured || showConfigRequired || embeddedAuthBrowser}
                onClick={() => void handleGoogleSignIn()}
              />

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
          </section>

          <footer className="vish-auth-card-footer">
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
          </footer>
        </div>

        <FoundersAcknowledgment variant="auth" />

        <section className="vish-auth-trust-section w-full" aria-labelledby="auth-trust-heading">
          <h2 id="auth-trust-heading" className="vish-auth-trust-heading">
            Trust &amp; evidence · विश्वास
          </h2>
          <div className="grid w-full items-stretch gap-3 sm:grid-cols-2 md:gap-4" data-testid="auth-trust-pillars">
          <AuthTrustPillar
            icon={Shield}
            badge="Release evidence"
            title="Release evidence pack"
            metric={String(WORLD_RECORD_METRIC_GATE_COUNT)}
            metricLabel="release checks"
            description="Automated pre-release verification with audit trail — in-repo evidence, not marketing claims."
            destination="/releases"
            variant="gates"
            staggerClass="vish-stagger-2"
            testId="auth-trust-pillar-gates"
            onLearnMore={() =>
              toast.message('Release evidence', {
                description: 'Sign in to open Releases and inspect gate snapshots.',
              })
            }
          />
          <AuthTrustPillar
            icon={Trophy}
            badge="Self-verified"
            title="World Records Registry"
            description={`${WORLD_RECORD_HONESTY_DISCLAIMER.split(' until ')[0]}. SHA-256 proof ledger for reproducible claims.`}
            destination="/world-records"
            variant="records"
            staggerClass="vish-stagger-3"
            testId="auth-trust-pillar-records"
            onLearnMore={() =>
              toast.message('World Records', {
                description: 'Sign in to view the Self-Verified Candidate registry at /world-records.',
              })
            }
          />
          </div>
        </section>
    </>
  );
}
