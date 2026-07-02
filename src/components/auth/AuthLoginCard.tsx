import {
  Building2,
  Copy,
  ExternalLink,
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
  embeddedAuthBrowser: boolean;
  embeddedBrowserLabel: string;
  externalAuthUrl: string;
  showConfigRequired: boolean;
  onSso: () => void;
  onRequestAccess: () => void;
  onCopyAuthUrl: () => void;
}

export default function AuthLoginCard({
  submitting,
  disabled,
  status,
  embeddedAuthBrowser,
  embeddedBrowserLabel,
  externalAuthUrl,
  showConfigRequired,
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
            Continue with Google SSO. Vishvakarma.OS uses Supabase Google OAuth as the only production login path.
          </p>
        </div>

        {showConfigRequired && (
          <p className="vish-login-page__status vish-login-page__status--error" role="alert">
            Backend not configured. Set Supabase environment variables and enable Google OAuth to sign in.
          </p>
        )}

        <div className="vish-login-page__form" data-testid="google-sso-only-auth">
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
            className="vish-login-page__primary touch-target"
            onClick={onSso}
            disabled={submitting || disabled || embeddedAuthBrowser}
            data-testid="google-sso-button"
          >
            {submitting ? 'Redirecting to Google…' : 'Continue with Google SSO'}
            <Building2 size={18} aria-hidden="true" />
          </button>

          <p className="vish-login-page__field-help vish-login-page__magic-help">
            No password, magic-link, or local demo login is available. Approved users sign in with Google through Supabase.
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
            Ask admin to approve your Google account
          </button>
        </div>
      </div>

      <div className="vish-login-page__version">{APP_VERSION}</div>
    </section>
  );
}
