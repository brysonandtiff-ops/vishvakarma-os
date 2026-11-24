import { OFFICIAL_LOGO_SRC } from '@/brand/officialLogo';

type SequenceVariant = 'welcome' | 'loading';

interface VishArchitecturalSequenceProps {
  variant?: SequenceVariant;
  message?: string;
}

/**
 * Brand-safe, decorative 2D-to-3D architectural illustration.
 * This does not represent progress or claim a 3D engine has finished loading.
 * The logo is the owner's exact official artwork, never a generated substitute.
 */
export function VishArchitecturalSequence({
  variant = 'welcome',
  message = 'Loading Vishvakarma.OS…',
}: VishArchitecturalSequenceProps) {
  const loading = variant === 'loading';

  return (
    <div
      className={`vish-architecture-cinema vish-architecture-cinema--${variant}`}
      data-testid={loading ? 'vish-cinematic-loading' : 'vish-cinematic-welcome'}
      role={loading ? 'status' : undefined}
      aria-live={loading ? 'polite' : undefined}
    >
      <div className="vish-architecture-cinema__identity" aria-hidden="true">
        <span className="vish-architecture-cinema__halo" />
        <img src={OFFICIAL_LOGO_SRC} alt="" width={64} height={64} decoding="async" />
      </div>

      <svg
        className="vish-architecture-cinema__drawing"
        viewBox="0 0 360 176"
        aria-hidden="true"
        focusable="false"
      >
        <path className="vish-architecture-cinema__grid" d="M0 44H360 M0 88H360 M0 132H360 M45 0V176 M90 0V176 M135 0V176 M180 0V176 M225 0V176 M270 0V176 M315 0V176" />
        <g className="vish-architecture-cinema__plan">
          <path d="M65 38H294V143H65Z M174 38V143 M65 88H174 M174 100H294 M93 38V70 M93 88V113" />
          <path className="vish-architecture-cinema__gold-stroke" d="M174 59H196 M220 100V127 M240 38H268" />
          <circle cx="174" cy="88" r="3" />
          <circle cx="294" cy="143" r="3" />
        </g>
        <g className="vish-architecture-cinema__home">
          <path className="vish-architecture-cinema__home-roof" d="M76 73L180 18L285 73L180 113Z" />
          <path className="vish-architecture-cinema__home-wall" d="M76 73V134L180 163V113Z M180 113V163L285 134V73Z" />
          <path className="vish-architecture-cinema__gold-stroke" d="M218 102L254 89V121L218 133Z M112 101L140 109V136L112 127Z" />
          <path d="M180 113V163 M76 73L180 113L285 73" />
        </g>
      </svg>

      <div className="vish-architecture-cinema__copy">
        <span className="vish-architecture-cinema__eyebrow">
          {loading ? 'Architecture studio' : 'Your ideas take shape'}
        </span>
        <p className="vish-architecture-cinema__title">
          {loading ? 'Preparing your studio' : 'From a sketch to a space'}
        </p>
        <p className="vish-architecture-cinema__caption">
          {loading ? message : 'Sketch your home  ·  See it in 3D  ·  Explore every room'}
        </p>
      </div>
      {loading && (
        <div className="vish-architecture-cinema__activity" aria-hidden="true">
          <span />
        </div>
      )}
    </div>
  );
}

export default VishArchitecturalSequence;
