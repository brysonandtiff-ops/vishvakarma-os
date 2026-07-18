import {
  Building2,
  Copy,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { APP_VERSION } from '@/config/appVersion';
import { isEmbeddedAuthErrorMessage } from '@/backend/authUiHelpers';

export type AuthLoginStatus = {
  message: string;
  variant: '' | 'error' | 'success';
};

interface AuthLoginCardProps {
  submitting: boolean;
  disabled: boolean;
  status: AuthLoginStatus | null;
  email: string;
  embeddedAuthBrowser: boolean;
  embeddedBrowserLabel: string;
  externalAuthUrl: string;
  showConfigRequired: boolean;
  onEmailChange: (email: string) => void;
  onEmailLink: () => void;
  onSso: () => void;
  onRequestAccess: () => void;
  onCopyAuthUrl: () => void;
}

export default function AuthLoginCard({
  submitting,
  disabled,
  status,
  email,
  embeddedAuthBrowser,
  embeddedBrowserLabel,
  externalAuthUrl,
  showConfigRequired,
  onEmailChange,
  onEmailLink,
  onSso,
  onRequestAccess,
  onCopyAuthUrl,
}: AuthLoginCardProps) {
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
            Sign in with Google SSO or request a secure one-time email link through Supabase.
          </p>
        </div>

        {showConfigRequired && (
          <p className="vish-login-page__status vish-login-page__status--error" role="alert">
            Backend not configured. Set the Supabase environment variables to enable sign-in.
          </p>
        )}

        <div className="vish-login-page__form" data-testid="supabase-auth-options">
          {showEmbeddedAuthRecovery && (
            <div className="vish-login-page__embedded-recovery">
              <p>Google OAuth is blocked in {embeddedBrowserLabel}. Use the email link below or open this page in your system browser.</p>
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
            className="vish-login-page__primary touch-target"
            onClick={onSso}
            disabled={submitting || disabled || embeddedAuthBrowser}
            data-testid="google-sso-button"
          >
            {submitting ? 'Starting secure sign-in…' : 'Continue with Google SSO'}
            <Building2 size={18} aria-hidden="true" />
          </button>

          <div className="vish-login-page__auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <form
            className="vish-login-page__email-link-form"
            onSubmit={(event) => {
              event.preventDefault();
              onEmailLink();
            }}
          >
            <label htmlFor="vish-auth-email" className="vish-login-page__email-label">
              Approved account email
            </label>
            <input
              id="vish-auth-email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              className="vish-login-page__email-input"
              disabled={submitting || disabled}
              data-testid="email-magic-link-input"
              required
            />
            <button
              type="submit"
              className="vish-auth-open-browser-btn vish-login-page__email-link-button touch-target"
              disabled={submitting || disabled}
              data-testid="email-magic-link-button"
            >
              <Mail size={16} aria-hidden="true" />
              {submitting ? 'Sending secure link…' : 'Email me a sign-in link'}
            </button>
          </form>

          <p className="vish-login-page__field-help vish-login-page__magic-help">
            Email links are one-time use, expire automatically, and do not create unapproved accounts.
          </p>

          <p
            className={`vish-login-page__status${status?.variant ? ` vish-login-page__status--${status.variant}` : ''}`}
            role="status"
            aria-live="polite"
          >
            {status?.message ?? ''}
          </p>
        </div>

        <div className="vish-login-page__request">
          Need access?{' '}
          <button type="button" className="vish-login-page__link touch-target" onClick={onRequestAccess}>
            Request access
          </button>
        </div>
      </div>

      <div className="vish-login-page__version">{APP_VERSION}</div>
    </section>
  );
}
