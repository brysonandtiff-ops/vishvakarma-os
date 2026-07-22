import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

interface AuthSignInHeaderProps {
  capabilitiesLoading: boolean;
  signInHeadline: string;
  signInHelperLine: string;
  isConfigured: boolean;
  workspaceStatusLabel: string;
}

export default function AuthSignInHeader({
  capabilitiesLoading,
  signInHeadline,
  signInHelperLine,
  isConfigured,
  workspaceStatusLabel,
}: AuthSignInHeaderProps) {
  return (
    <header className="vish-auth-card-header mb-4 flex flex-col items-center text-center">
      <p className="vish-devanagari-hero mb-2 text-base sm:text-lg">ॐ श्री विश्वकर्मणे नमः</p>
      <div className="vish-auth-logo-hero">
        <div className="vish-auth-logo-mandala" aria-hidden="true">
          <div className="vish-auth-logo-ring vish-auth-logo-ring-outer" />
          <div className="vish-auth-logo-ring vish-auth-logo-ring-mid" />
          <div className="vish-auth-logo-ring vish-auth-logo-ring-inner" />
          <div className="vish-auth-logo-aura" />
          <div className="vish-auth-logo-yantra" />
        </div>
        <div className="vish-auth-logo-wrap">
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Vishvakarma.OS official user-supplied swan V logo"
            className="vish-auth-logo-img"
            width={76}
            height={76}
            decoding="async"
          />
        </div>
      </div>
      <h1
        id="auth-page-title"
        className="vish-wordmark vish-auth-wordmark vish-auth-wordmark-breathe text-lg font-bold tracking-[0.28em] text-primary sm:text-xl"
      >
        VISHVAKARMA.OS
      </h1>
      <div className="vish-auth-wordmark-divider" aria-hidden="true" />
      <p className="vish-auth-card-tagline mt-1.5 text-xs text-primary/70">iPad-First Architecture Studio</p>
      <div
        className="vish-auth-workspace-badge vish-auth-workspace-badge--compact mt-2"
        data-testid="auth-supabase-badge"
        title={
          isConfigured
            ? 'Authentication and data run on Supabase (Postgres + Auth)'
            : 'Supabase env vars not configured — local draft mode'
        }
      >
        <span
          className={`vish-auth-supabase-pill ${isConfigured ? 'vish-auth-supabase-pill--live' : 'vish-auth-supabase-pill--draft'}`}
        >
          Supabase Auth
        </span>
        <span className="vish-auth-workspace-badge__sep" aria-hidden="true">
          ·
        </span>
        <span className={`vish-gold-pill ${isConfigured ? 'vish-gold-pill--live' : 'vish-gold-pill--draft'}`}>
          {workspaceStatusLabel}
        </span>
      </div>
      <div className="vish-auth-signin-copy mt-3">
        <p className="vish-auth-card-headline text-sm font-medium text-foreground sm:text-base" aria-live="polite">
          {capabilitiesLoading ? 'Preparing sign-in…' : signInHeadline}
        </p>
        <p className="vish-auth-card-helper mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
          {capabilitiesLoading ? 'Checking verified sign-in methods…' : signInHelperLine}
        </p>
      </div>
    </header>
  );
}
