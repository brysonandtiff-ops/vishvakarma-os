import {
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';
import { APP_VERSION } from '@/config/appVersion';
import { MIN_ACCOUNT_PASSWORD_LENGTH } from '@/backend/supabase/supabaseAccountLifecycle';

export type AuthLoginStatus = {
  message: string;
  variant: '' | 'error' | 'success';
};

export type AuthFormMode = 'sign-in' | 'create-account';

interface AuthLoginCardProps {
  mode: AuthFormMode;
  submitting: boolean;
  disabled: boolean;
  status: AuthLoginStatus | null;
  email: string;
  password: string;
  confirmPassword: string;
  showConfigRequired: boolean;
  onModeChange: (mode: AuthFormMode) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
}

export default function AuthLoginCard({
  mode,
  submitting,
  disabled,
  status,
  email,
  password,
  confirmPassword,
  showConfigRequired,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onForgotPassword,
}: AuthLoginCardProps) {
  const creatingAccount = mode === 'create-account';

  return (
    <section className="vish-login-page__auth-side" aria-label="Vishvakarma.OS account access">
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
            Secure email and password accounts are provided directly by Supabase Auth.
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

        <div className="mb-4 grid grid-cols-2 gap-2" aria-label="Account action">
          <button
            type="button"
            className="vish-login-page__link touch-target rounded-lg border border-white/10 px-3 py-2"
            aria-pressed={!creatingAccount}
            data-testid="auth-mode-sign-in"
            disabled={submitting}
            onClick={() => onModeChange('sign-in')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="vish-login-page__link touch-target rounded-lg border border-white/10 px-3 py-2"
            aria-pressed={creatingAccount}
            data-testid="auth-mode-create-account"
            disabled={submitting}
            onClick={() => onModeChange('create-account')}
          >
            Create account
          </button>
        </div>

        {showConfigRequired && (
          <p className="vish-login-page__status vish-login-page__status--error" role="alert">
            Backend not configured. Set the Supabase environment variables to enable accounts.
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
              Email address
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
                autoComplete={creatingAccount ? 'new-password' : 'current-password'}
                placeholder={creatingAccount ? 'Create a strong password' : 'Enter your password'}
                className="vish-login-page__email-input pl-10"
                disabled={submitting || disabled}
                data-testid="supabase-password-input"
                minLength={creatingAccount ? MIN_ACCOUNT_PASSWORD_LENGTH : undefined}
                required
              />
            </div>

            {creatingAccount && (
              <>
                <label htmlFor="vish-auth-confirm-password" className="vish-login-page__email-label">
                  Confirm password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="vish-auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter the same password again"
                    className="vish-login-page__email-input pl-10"
                    disabled={submitting || disabled}
                    data-testid="supabase-confirm-password-input"
                    minLength={MIN_ACCOUNT_PASSWORD_LENGTH}
                    required
                  />
                </div>
                <p className="vish-login-page__field-help">
                  Use {MIN_ACCOUNT_PASSWORD_LENGTH}+ characters with upper- and lowercase letters and a number.
                </p>
              </>
            )}

            <button
              type="submit"
              className="vish-login-page__primary touch-target"
              disabled={submitting || disabled}
              data-testid={creatingAccount ? 'supabase-create-account-button' : 'supabase-password-button'}
            >
              {submitting
                ? creatingAccount
                  ? 'Creating account…'
                  : 'Verifying with Supabase…'
                : creatingAccount
                  ? 'Create Supabase account'
                  : 'Sign in with Supabase'}
              {creatingAccount ? <UserPlus size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
            </button>
          </form>

          {!creatingAccount && (
            <button
              type="button"
              className="vish-login-page__link touch-target mx-auto mt-3 inline-flex items-center gap-2"
              onClick={onForgotPassword}
              disabled={submitting || disabled}
              data-testid="supabase-forgot-password-button"
            >
              <KeyRound size={15} aria-hidden="true" />
              Forgot password?
            </button>
          )}

          <p className="vish-login-page__field-help vish-login-page__magic-help">
            {creatingAccount
              ? 'Supabase will email a verification link before the new account can sign in.'
              : 'Authentication and session recovery are verified directly by Supabase.'}
          </p>

          <p
            className={`vish-login-page__status${status?.variant ? ` vish-login-page__status--${status.variant}` : ''}`}
            role="status"
            aria-live="polite"
          >
            {status?.message ?? ''}
          </p>
        </div>
      </div>

      <div className="vish-login-page__version">{APP_VERSION}</div>
    </section>
  );
}
