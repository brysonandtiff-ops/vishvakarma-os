import { FormEvent, useId } from 'react';
import {
  ArrowRight,
  Building2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Send,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { APP_VERSION } from '@/config/appVersion';
import { isEmbeddedAuthErrorMessage } from '@/backend/authUiHelpers';

export type AuthLoginStatus = {
  message: string;
  variant: '' | 'error' | 'success';
};

interface AuthLoginCardProps {
  email: string;
  password: string;
  rememberDevice: boolean;
  showPassword: boolean;
  submitting: boolean;
  disabled: boolean;
  status: AuthLoginStatus | null;
  embeddedAuthBrowser: boolean;
  embeddedBrowserLabel: string;
  externalAuthUrl: string;
  completingEmailLink: boolean;
  needsEmailForLink: boolean;
  passwordResetNotice: boolean;
  sessionRestoreTimeoutNotice: boolean;
  showConfigRequired: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberDeviceChange: (value: boolean) => void;
  onTogglePassword: () => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
  onCompleteEmailLink: (event: FormEvent<HTMLFormElement>) => void;
  onMagicLink: () => void;
  onForgotPassword: () => void;
  onSso: () => void;
  onRequestAccess: () => void;
  onCopyAuthUrl: () => void;
  allowLocalWorkspace?: boolean;
  onLocalWorkspace?: () => void;
}

export default function AuthLoginCard({
  email,
  password,
  rememberDevice,
  showPassword,
  submitting,
  disabled,
  status,
  embeddedAuthBrowser,
  embeddedBrowserLabel,
  externalAuthUrl,
  completingEmailLink,
  needsEmailForLink,
  passwordResetNotice,
  sessionRestoreTimeoutNotice,
  showConfigRequired,
  onEmailChange,
  onPasswordChange,
  onRememberDeviceChange,
  onTogglePassword,
  onSignIn,
  onCompleteEmailLink,
  onMagicLink,
  onForgotPassword,
  onSso,
  onRequestAccess,
  onCopyAuthUrl,
  allowLocalWorkspace,
  onLocalWorkspace,
}: AuthLoginCardProps) {
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const statusId = useId();
  const passwordHelpId = useId();

  const showEmbeddedAuthRecovery =
    embeddedAuthBrowser ||
    Boolean(status?.variant === 'error' && status.message && isEmbeddedAuthErrorMessage(status.message));

  return (
    <section className="vish-login-page__auth-side" aria-label="Sign in to Vishvakarma.OS">
      <div className="vish-login-page__top-line">
        Architecture • Engineering • Construction
        <br />
        United by Dharma, Driven by Design
      </div>

      <div className="vish-auth-card-mockup vish-login-page__auth-card" data-testid="auth-mockup-card">
        <div className="vish-login-page__logo">
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Vishvakarma.OS swan logo"
            className="vish-login-page__logo-img"
            width={38}
            height={38}
            decoding="async"
          />
        </div>

        <div className="vish-login-page__auth-heading">
          <h1 id="auth-page-title">
            Vishvakarma<span>.OS</span>
          </h1>
          <p>Architect • Engineer • Create</p>
          <p className="vish-login-page__auth-note">
            Use a secure email access link or continue with Google OAuth.
          </p>
        </div>

        {showConfigRequired && (
          <p className="vish-login-page__status vish-login-page__status--error" role="alert">
            Backend not configured. Set Supabase environment variables to enable authentication.
          </p>
        )}

        {passwordResetNotice && (
          <p className="vish-login-page__status" role="status">
            Password reset is not available in this environment. Use a magic link or Google sign-in instead.
          </p>
        )}

        {sessionRestoreTimeoutNotice && (
          <p className="vish-login-page__status" role="status">
            Session expired. Please sign in again to continue.
          </p>
        )}

        {completingEmailLink && (
          <p className="vish-login-page__status" role="status" aria-live="polite">
            Completing sign-in from email link…
          </p>
        )}

        {needsEmailForLink ? (
          <form className="vish-login-page__form" onSubmit={onCompleteEmailLink} noValidate>
            <div className="vish-login-page__field">
              <label htmlFor={emailId}>Confirm email address</label>
              <Mail className="vish-login-page__field-icon" size={18} aria-hidden="true" />
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                enterKeyHint="go"
                spellCheck={false}
                required
                disabled={submitting}
                aria-describedby={statusId}
              />
            </div>
            <button type="submit" className="vish-login-page__primary touch-target" disabled={submitting || disabled}>
              {submitting ? 'Verifying…' : 'Complete sign-in'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <form className="vish-login-page__form" onSubmit={onSignIn} noValidate>
            <div className="vish-login-page__field">
              <label htmlFor={emailId}>Email Address</label>
              <Mail className="vish-login-page__field-icon" size={18} aria-hidden="true" />
              <input
                id={emailId}
                name="email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="architect@firm.com"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                enterKeyHint="next"
                spellCheck={false}
                required
                disabled={submitting || disabled}
                aria-describedby={statusId}
              />
            </div>

            <div className="vish-login-page__row">
              <label className="vish-login-page__remember touch-target" htmlFor={rememberId}>
                <input
                  id={rememberId}
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) => onRememberDeviceChange(event.target.checked)}
                  disabled={submitting || disabled}
                />
                Remember this device
              </label>
            </div>

            <button type="submit" className="vish-login-page__primary touch-target" disabled={submitting || disabled}>
              {submitting ? 'Sending link…' : 'Send magic link'}
              <Send size={18} aria-hidden="true" />
            </button>

            <p className="vish-login-page__field-help vish-login-page__magic-help">
              We email you a secure one-time sign-in link — no password required.
            </p>

            <div className="vish-login-page__divider" aria-hidden="true">
              OR
            </div>

            {showEmbeddedAuthRecovery && (
              <div className="vish-login-page__embedded-recovery">
                <p>Open in your system browser — Google OAuth is blocked in {embeddedBrowserLabel}.</p>
                <div className="vish-login-page__embedded-recovery-actions">
                  <a
                    href={externalAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vish-auth-open-browser-btn touch-target flex-1"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Open in browser
                  </a>
                  <button type="button" className="vish-auth-copy-url-btn touch-target" onClick={onCopyAuthUrl}>
                    <Copy size={14} aria-hidden="true" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="vish-login-page__secondary touch-target"
              onClick={onSso}
              disabled={submitting || disabled || embeddedAuthBrowser}
            >
              <span className="vish-login-page__secondary-icon">
                <Building2 size={18} aria-hidden="true" />
              </span>
              <span>
                <b>Continue with SSO</b>
                <small>Secure Google OAuth for companies and teams</small>
              </span>
            </button>

            {allowLocalWorkspace && onLocalWorkspace && (
              <button
                type="button"
                className="vish-login-page__secondary touch-target"
                onClick={onLocalWorkspace}
              >
                <span className="flex w-full items-center justify-center">
                  <b>Enter local workspace · स्थानीय कार्यस्थान</b>
                </span>
              </button>
            )}

            <p
              id={statusId}
              className={`vish-login-page__status${status?.variant ? ` vish-login-page__status--${status.variant}` : ''}`}
              role="status"
              aria-live="polite"
            >
              {status?.message ?? ''}
            </p>
          </form>
        )}

        <div className="vish-login-page__request">
          New to Vishvakarma.OS?{' '}
          <button type="button" className="vish-login-page__link touch-target" onClick={onRequestAccess}>
            Request access
          </button>
        </div>
      </div>

      <div className="vish-login-page__version">{APP_VERSION}</div>
    </section>
  );
}
