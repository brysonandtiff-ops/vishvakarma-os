import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Hammer,
  Leaf,
  Lock,
  Mail,
  Send,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
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
import AuthTrustPillar from '@/components/auth/AuthTrustPillar';
import { FoundersAcknowledgment } from '@/components/brand/FoundersAcknowledgment';
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

const HERO_FEATURES = [
  { icon: Compass, label: 'Design', detail: 'With Intelligence' },
  { icon: Hammer, label: 'Build', detail: 'With Precision' },
  { icon: Sparkles, label: 'Create', detail: 'With Purpose' },
  { icon: Leaf, label: 'Sustain', detail: 'For Generations' },
] as const;

export default function AuthPage() {
  const {
    user,
    isConfigured,
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

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

  const embeddedAuthBrowser = useMemo(
    () => typeof navigator !== 'undefined' && isEmbeddedAuthBrowser(),
    [],
  );
  const embeddedBrowserLabel = useMemo(
    () => (typeof navigator !== 'undefined' ? getEmbeddedAuthBrowserLabel() : 'embedded browser'),
    [],
  );
  const externalAuthUrl = useMemo(() => getAuthPageUrl(), []);

  const showEmbeddedAuthRecovery =
    embeddedAuthBrowser ||
    Boolean((emailLinkError ?? error) && isEmbeddedAuthErrorMessage(emailLinkError ?? error ?? ''));

  const completingEmailLink = emailLinkState === 'completing';
  const needsEmailForLink = emailLinkState === 'needs_email';
  const authDisabled = submitting || completingEmailLink || showConfigRequired;

  if (user) {
    return <Navigate to={POST_AUTH_DESTINATION} replace />;
  }

  const sendAccessLink = async (source: 'sign-in' | 'magic-link' | 'request-access' | 'forgot-password') => {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address to request a secure access link.');
      return;
    }

    if (source === 'sign-in' && password.trim()) {
      setMessage('This workspace uses secure email links instead of passwords. Sending your access link…');
    }

    setSubmitting(true);
    const result = await requestAccessLink(email);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (source === 'forgot-password') {
      setMessage(`Password reset is unavailable. Secure access link sent to ${emailPreview}.`);
      return;
    }

    setMessage(`Secure access link sent to ${emailPreview}. Check your inbox, then return to Vishvakarma.OS.`);
  };

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

  const onSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendAccessLink('sign-in');
  };

  const handleForgotPassword = () => {
    setForgotPasswordNotice(true);
    setError(null);
    setMessage(null);
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

      <div className="vish-auth-mockup-page">
        <div className="vish-auth-mockup-page__grid">
          <section className="vish-auth-mockup-hero" aria-label="Vishvakarma brand hero">
            <div className="vish-auth-mockup-brand">
              <div className="vish-auth-mockup-om" aria-hidden="true">
                ॐ
              </div>
              <p className="sr-only">ॐ श्री विश्वकर्मणे नमः</p>
              <p className="vish-auth-mockup-brand-title">Vishvakarma</p>
              <p className="vish-auth-mockup-brand-sub">The Divine Architect of All Creation</p>
            </div>

            <div className="vish-auth-mockup-deity" aria-hidden="true">
              <div className="vish-auth-mockup-deity-glow" />
              <div className="vish-auth-mockup-trident">
                <div className="prong left" />
                <div className="prong center" />
                <div className="prong right" />
                <div className="shaft" />
              </div>
              <div className="vish-auth-mockup-crescent" />
              <div className="vish-auth-mockup-deity-face" />
            </div>

            <div className="vish-auth-mockup-features">
              {HERO_FEATURES.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="vish-auth-mockup-feature">
                  <div className="vish-auth-mockup-feature-icon">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <strong>{label}</strong>
                    <span>{detail}</span>
                  </div>
                </div>
              ))}
            </div>

            <blockquote className="vish-auth-mockup-quote">
              <p className="sanskrit">यत्र विश्वं भवत्येकनीडम्</p>
              <p>&ldquo;Where the world becomes one nest&rdquo;</p>
              <small>— Atharva Veda</small>
            </blockquote>
          </section>

          <section className="vish-auth-mockup-side" aria-labelledby="auth-page-title">
            <p className="vish-auth-mockup-topline">
              Architecture • Engineering • Construction
              <br />
              United by Dharma, Driven by Design
            </p>

            <div
              className="vish-auth-mockup-card sacred-auth-card vish-auth-card-mockup"
              data-testid="auth-mockup-card"
            >
              <div className="vish-auth-mockup-logo sacred-auth-logo">
                <img
                  src={OFFICIAL_LOGO_SRC}
                  alt="Vishvakarma.OS swan logo"
                  width={42}
                  height={42}
                  decoding="async"
                />
                <span className="sr-only sacred-auth-logo__text">Vishvakarma.OS</span>
              </div>

              <div className="vish-auth-mockup-heading">
                <h1 id="auth-page-title">
                  VISHVAKARMA<span>.OS</span>
                </h1>
                <p>Architect • Engineer • Create</p>
                <p className="sr-only">
                  {capabilitiesLoading ? 'Preparing…' : signInHeadline} —{' '}
                  {capabilitiesLoading ? 'Verifying sign-in methods…' : signInHelperLine}
                </p>
                <p className="sr-only">
                  {showEmailSignIn ? 'email winner' : ''}
                  {showGoogleSignIn ? 'google winner' : ''}
                  {showSignInUnavailable ? 'no winner' : ''}
                </p>
              </div>

              {showConfigRequired && (
                <AuthStatusBanner variant="warning" className="mb-3">
                  Backend not configured. Set Supabase environment variables to enable authentication.
                </AuthStatusBanner>
              )}
              {(passwordResetNotice || forgotPasswordNotice) && (
                <AuthStatusBanner variant="info" className="mb-3">
                  Password sign-in is not available. Use the method below to access your workspace.
                  {forgotPasswordNotice && (
                    <button
                      type="button"
                      className="vish-auth-mockup-link ml-2"
                      onClick={() => void sendAccessLink('forgot-password')}
                    >
                      Send magic link instead
                    </button>
                  )}
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
              {completingEmailLink && (
                <AuthStatusBanner variant="info" loading className="mb-3">
                  Completing sign-in from email link…
                </AuthStatusBanner>
              )}

              {needsEmailForLink ? (
                <form onSubmit={onCompleteEmailLink} className="vish-auth-mockup-form sacred-auth-form">
                  <div className="vish-auth-mockup-field">
                    <label htmlFor="auth-email-complete">Email address</label>
                    <Mail className="vish-auth-mockup-field-icon" size={18} aria-hidden="true" />
                    <input
                      id="auth-email-complete"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="architect@firm.com"
                      className="sacred-auth-input"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="vish-auth-mockup-primary">
                    {submitting ? 'Verifying…' : 'Complete sign-in · प्रवेश'}
                  </button>
                </form>
              ) : (
                <form onSubmit={onSignInSubmit} className="vish-auth-mockup-form sacred-auth-form">
                  {message && (
                    <AuthStatusBanner variant="info" loading={submitting} className="mb-2">
                      {message}
                    </AuthStatusBanner>
                  )}

                  <div className="vish-auth-mockup-field">
                    <label htmlFor="auth-email">Email address</label>
                    <Mail className="vish-auth-mockup-field-icon" size={18} aria-hidden="true" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="sacred-auth-input"
                      autoComplete="email"
                      required
                      disabled={authDisabled}
                    />
                  </div>

                  <div className="vish-auth-mockup-field">
                    <label htmlFor="auth-password">Password</label>
                    <Lock className="vish-auth-mockup-field-icon" size={18} aria-hidden="true" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="sacred-auth-input"
                      autoComplete="off"
                      disabled={authDisabled}
                    />
                    <button
                      type="button"
                      className="vish-auth-mockup-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="vish-auth-mockup-row">
                    <label className="vish-auth-mockup-remember">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                      />
                      Remember this device
                    </label>
                    <button type="button" className="vish-auth-mockup-link" onClick={handleForgotPassword}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={authDisabled} className="vish-auth-mockup-primary">
                    Sign In
                    <ChevronRight size={18} aria-hidden="true" />
                    <ChevronRight size={18} className="-ml-3" aria-hidden="true" />
                  </button>

                  <div className="vish-auth-mockup-divider">OR</div>

                  <button
                    type="button"
                    className="vish-auth-mockup-secondary"
                    disabled={authDisabled}
                    onClick={() => void sendAccessLink('magic-link')}
                  >
                    <Send size={20} aria-hidden="true" />
                    <span>
                      <b>Magic Link</b>
                      <small>Request access link · Sign in securely without a password</small>
                    </span>
                  </button>

                  {showEmbeddedAuthRecovery && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="text-xs font-semibold text-amber-300 mb-1">Open in your system browser</p>
                      <p className="text-[0.7rem] text-amber-200/70 leading-relaxed mb-2">
                        Google OAuth is blocked in {embeddedBrowserLabel}. Use Chrome or Safari for a one-time
                        sign-in, then return to the app.
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={externalAuthUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vish-auth-mockup-secondary text-xs !min-h-[36px] !py-2 flex-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            <b>Open in browser</b>
                          </span>
                        </a>
                        <button
                          type="button"
                          className="vish-auth-mockup-secondary text-xs !min-h-[36px] !py-2"
                          onClick={() => void handleCopyAuthUrl()}
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            <b>Copy</b>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {showEmbeddedAuthRecovery && (
                    type="button"
                    className="vish-auth-mockup-secondary"
                    disabled={authDisabled || embeddedAuthBrowser}
                    onClick={() => void handleGoogleSignIn()}
                  >
                    <Building2 size={20} aria-hidden="true" />
                    <span>
                      <b>Continue with SSO</b>
                      <small>For companies &amp; teams</small>
                    </span>
                  </button>

                  {allowLocalWorkspace && (
                    <button
                      type="button"
                      className="vish-auth-mockup-secondary"
                      onClick={() => navigate('/editor')}
                    >
                      <span>
                        <b>Enter local workspace · स्थानीय कार्यस्थान</b>
                      </span>
                    </button>
                  )}

                  <p className="vish-auth-mockup-request">
                    New to Vishvakarma.OS?{' '}
                    <button
                      type="button"
                      className="vish-auth-mockup-link"
                      disabled={authDisabled}
                      onClick={() => void sendAccessLink('request-access')}
                    >
                      Request access link · Request access
                    </button>
                  </p>
                </form>
              )}
            </div>

            <div className="vish-auth-mockup-founders">
              <FoundersAcknowledgment variant="auth" />
            </div>

            <p className="vish-auth-mockup-version">v1.0.0</p>
          </section>

          <div
            className="vish-auth-mockup-trust-wrap sacred-auth-trust"
            data-testid="auth-trust-pillars"
            aria-labelledby="auth-trust-heading"
          >
            <h2 id="auth-trust-heading" className="sr-only">
              Trust &amp; evidence
            </h2>

            <AuthTrustPillar
              icon={Shield}
              badge="Release evidence"
              title={`${WORLD_RECORD_METRIC_GATE_COUNT} Release Gates`}
              description="Automated pre-release verification with audit trail."
              metric={String(WORLD_RECORD_METRIC_GATE_COUNT)}
              metricLabel="gates"
              destination="/releases"
              variant="gates"
              testId="auth-trust-pillar-gates"
              onLearnMore={() =>
                toast.message('Release evidence', {
                  description: 'Sign in to open Releases and inspect gate snapshots.',
                })
              }
            />

            <AuthTrustPillar
              icon={Trophy}
              badge="World records"
              title="World Records Registry"
              description={`${WORLD_RECORD_HONESTY_DISCLAIMER.split(' until ')[0]}.`}
              destination="/world-records"
              variant="records"
              testId="auth-trust-pillar-records"
              onLearnMore={() =>
                toast.message('World Records', {
                  description: 'Sign in to view the Self-Verified Candidate registry.',
                })
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
