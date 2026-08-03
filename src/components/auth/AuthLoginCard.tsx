import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { APP_VERSION } from '@/config/appVersion';

export type AuthLoginStatus = {
  message: string;
  variant: '' | 'error' | 'success';
};

interface AuthLoginCardProps {
  submitting: boolean;
  disabled: boolean;
  status: AuthLoginStatus | null;
  email: string;
  password: string;
  showConfigRequired: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onRequestAccess: () => void;
}

export default function AuthLoginCard({
  submitting,
  disabled,
  status,
  email,
  password,
  showConfigRequired,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onRequestAccess,
}: AuthLoginCardProps) {
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
            Sign in with the approved Supabase email account. Legacy social and magic-link options are disabled.
          </p>
        </div>

        <div
          className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
          data-testid="supabase-auth-badge"
          aria-label={showConfigRequired ? 'Supabase Auth setup required' : 'Supabase Auth connected'}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          {showConfigRequired ? 'Supabase Auth • Setup required' : 'Supabase Auth • Connected'}
        </div>

        {showConfigRequired && (
          <p className="vish-login-page__status vish-login-page__status--error" role="alert">
            Backend not configured. Set the Supabase environment variables to enable sign-in.
          </p>
        )}

        <div className="vish-login-page__form" data-testid="supabase-password-auth">
          <form
            className="vish-login-page__email-link-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label htmlFor="vish-auth-email" className="vish-login-page__email-label">
              Approved Supabase email
            </label>
            <div className="relative">
              <Mail
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="vish-auth-email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
                className="vish-login-page__email-input pl-10"
                disabled={submitting || disabled}
                data-testid="supabase-email-input"
                required
              />
            </div>

            <label htmlFor="vish-auth-password" className="vish-login-page__email-label">
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="vish-auth-password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="vish-login-page__email-input pl-10"
                disabled={submitting || disabled}
                data-testid="supabase-password-input"
                required
              />
            </div>

            <button
              type="submit"
              className="vish-login-page__primary touch-target"
              disabled={submitting || disabled}
              data-testid="supabase-password-button"
            >
              {submitting ? 'Verifying with Supabase…' : 'Sign in with Supabase'}
              <ShieldCheck size={18} aria-hidden="true" />
            </button>
          </form>

          <p className="vish-login-page__field-help vish-login-page__magic-help">
            This is the only enabled sign-in method. Authentication is verified directly by Supabase.
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
