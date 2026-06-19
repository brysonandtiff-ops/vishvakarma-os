import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Copy, Download, ExternalLink, Home, Shield, Trophy } from 'lucide-react';
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
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import AuthGoogleButton from '@/components/auth/AuthGoogleButton';
import AuthStatusBanner from '@/components/auth/AuthStatusBanner';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
import { SacredTempleGate } from '@/components/common/SacredTempleGate';
import PageMeta from '@/components/common/PageMeta';

function getSignInHeadline(winner: 'email' | 'google' | 'none') {
  if (winner === 'google') return 'Sign in with Google';
  if (winner === 'email') return 'Sign in with a secure email link';
  return 'Sign-in temporarily unavailable';
}

function getSignInHelperLine(winner: 'email' | 'google' | 'none') {
  if (winner === 'google') return 'Open your protected workspace with a verified Google account.';
  if (winner === 'email') return 'We email a one-time secure link — no password stored.';
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
    embeddedAuthBrowser ||
    Boolean((emailLinkError ?? error) && isEmbeddedAuthErrorMessage(emailLinkError ?? error ?? ''));

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

  return (
    <>
      <PageMeta
        title="Sign In — Vishvakarma.OS"
        description="Enter the sacred architecture workspace. Sign in to access your governed blueprint projects."
      />

      <SacredTempleGate>
        {/* ═══════════ AUTH CARD ═══════════ */}
        <div className="sacred-auth-card" data-testid="auth-card">
          <div className="sacred-auth-card__inner sacred-animate-stagger">

            {/* ── Header: Swan Logo + Mantra + Title ── */}
            <header className="sacred-auth-header">
              {/* Swan Logo — PRESERVED EXACTLY */}
              <div className="sacred-auth-logo">
                <div className="sacred-auth-logo__mark">
                  <img
                    src={OFFICIAL_LOGO_SRC}
                    alt="Vishvakarma.OS swan logo"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                    decoding="async"
                  />
                </div>
                <span className="sacred-auth-logo__text">Vishvakarma.OS</span>
              </div>

              {/* Sacred Mantra */}
              <p className="sacred-auth-mantra">ॐ श्री विश्वकर्मणे नमः</p>

              {/* Title */}
              <h1 className="sacred-auth-title" id="auth-page-title">
                {capabilitiesLoading ? 'Preparing…' : signInHeadline}
              </h1>
              <p className="sacred-auth-subtitle">
                {capabilitiesLoading ? 'Verifying sign-in methods…' : signInHelperLine}
              </p>

              {/* Workspace status badge */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide uppercase ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  />
                  {workspaceStatusLabel}
                </span>
              </div>
            </header>

            {/* ── Sacred Divider ── */}
            <div className="sacred-auth-divider" />

            {/* ── Status Banners ── */}
            {showConfigRequired && (
              <AuthStatusBanner variant="warning" className="mb-3">
                Backend not configured. Set Supabase environment variables to enable authentication.
              </AuthStatusBanner>
            )}
            {passwordResetNotice && (
              <AuthStatusBanner variant="info" className="mb-3">
                Password sign-in is not available. Use the method below to access your workspace.
              </AuthStatusBanner>
            )}
            {sessionRestoreTimeoutNotice && (
              <AuthStatusBanner variant="info" className="mb-3">
                Session expired. Please sign in again to continue.
              </AuthStatusBanner>
            )}
            {showSignInUnavailable && isConfigured && !showConfigRequired && (
              <AuthStatusBanner variant="warning" className="mb-3">
                Sign-in methods are being verified. Please try again shortly.
              </AuthStatusBanner>
            )}
            {(emailLinkError || error) && (
              <AuthStatusBanner variant="error" className="mb-3">
                {emailLinkError || error}
              </AuthStatusBanner>
            )}

            {/* ═══ EMAIL SIGN-IN ═══ */}
            {showEmailSignIn && (
              <>
                {completingEmailLink && (
                  <AuthStatusBanner variant="info" loading className="mb-3">
                    Completing sign-in from email link…
                  </AuthStatusBanner>
                )}
                {needsEmailForLink && (
                  <form onSubmit={onCompleteEmailLink} className="sacred-auth-form">
                    <p className="text-xs text-[hsl(230_15%_60%)] mb-1">
                      Confirm the email that received the access link:
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="architect@firm.com"
                      className="sacred-auth-input"
                      autoComplete="email"
                      required
                    />
                    <button type="submit" disabled={submitting} className="sacred-auth-btn-primary">
                      {submitting ? 'Verifying…' : 'Complete sign-in · प्रवेश'}
                    </button>
                  </form>
                )}
                {!completingEmailLink && !needsEmailForLink && (
                  <form onSubmit={onSubmit} className="sacred-auth-form">
                    {message && (
                      <AuthStatusBanner variant="info" loading className="mb-2">
                        {message}
                      </AuthStatusBanner>
                    )}
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com · ईमेल"
                      className="sacred-auth-input"
                      autoComplete="email"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      disabled={submitting || !isConfigured || showConfigRequired}
                      className="sacred-auth-btn-primary"
                    >
                      {submitting ? 'Sending link…' : 'Request access link · प्रवेश लिंक'}
                    </button>
                    {allowLocalWorkspace && (
                      <button
                        type="button"
                        className="sacred-auth-btn-oauth"
                        onClick={() => navigate('/editor')}
                      >
                        Enter local workspace · स्थानीय कार्यस्थान
                      </button>
                    )}
                  </form>
                )}
              </>
            )}

            {/* ═══ GOOGLE SIGN-IN ═══ */}
            {showGoogleSignIn && (
              <div className="sacred-auth-form">
                {showEmbeddedAuthRecovery && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-300 mb-1">
                      Open in your system browser
                    </p>
                    <p className="text-[0.7rem] text-amber-200/70 leading-relaxed mb-2">
                      Google OAuth is blocked in {embeddedBrowserLabel}. Use Chrome or Safari for a
                      one-time sign-in, then return to the app.
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={externalAuthUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sacred-auth-btn-oauth text-xs !min-h-[36px] !py-2 flex-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Open in browser
                      </a>
                      <button
                        type="button"
                        className="sacred-auth-btn-oauth text-xs !min-h-[36px] !py-2"
                        onClick={() => void handleCopyAuthUrl()}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {message && (
                  <AuthStatusBanner variant="info" loading className="mb-3">
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
                    className="sacred-auth-btn-oauth mt-2"
                    onClick={() => navigate('/editor')}
                  >
                    Enter local workspace · स्थानीय कार्यस्थान
                  </button>
                )}
              </div>
            )}

            {/* ── Footer Links ── */}
            <footer className="sacred-auth-footer">
              <button
                type="button"
                className="sacred-auth-footer-link"
                onClick={() => navigate('/')}
              >
                <Home className="h-3.5 w-3.5" />
                Home · मुख्य
              </button>
              <button
                type="button"
                className="sacred-auth-footer-link"
                onClick={() => navigate('/features')}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Features · विशेषताएँ
              </button>
              <button type="button" className="sacred-auth-footer-link" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" />
                Install · गृह-स्थापना
              </button>
            </footer>
          </div>
        </div>

        {/* Founders acknowledgment — PRESERVED */}
        <FoundersAcknowledgment variant="auth" />

        {/* ═══ TRUST PILLARS ═══ */}
        <section className="sacred-auth-trust" aria-labelledby="auth-trust-heading">
          <h2 id="auth-trust-heading" className="sr-only">
            Trust &amp; evidence
          </h2>

          <div
            className="sacred-auth-trust-card sacred-animate-in sacred-animate-in-delay-3"
            onClick={() =>
              toast.message('Release evidence', {
                description: 'Sign in to open Releases and inspect gate snapshots.',
              })
            }
            data-testid="auth-trust-pillar-gates"
            role="button"
            tabIndex={0}
          >
            <Shield className="sacred-auth-trust-card__icon" />
            <p className="sacred-auth-trust-card__title">
              {WORLD_RECORD_METRIC_GATE_COUNT} Release Gates
            </p>
            <p className="sacred-auth-trust-card__desc">
              Automated pre-release verification with audit trail.
            </p>
          </div>

          <div
            className="sacred-auth-trust-card sacred-animate-in sacred-animate-in-delay-4"
            onClick={() =>
              toast.message('World Records', {
                description: 'Sign in to view the Self-Verified Candidate registry.',
              })
            }
            data-testid="auth-trust-pillar-records"
            role="button"
            tabIndex={0}
          >
            <Trophy className="sacred-auth-trust-card__icon" />
            <p className="sacred-auth-trust-card__title">World Records Registry</p>
            <p className="sacred-auth-trust-card__desc">
              {WORLD_RECORD_HONESTY_DISCLAIMER.split(' until ')[0]}.
            </p>
          </div>
        </section>
      </SacredTempleGate>
    </>
  );
}
