const FEATURES = [
  { icon: '◇', title: 'Design', subtitle: 'With Intelligence' },
  { icon: '⬡', title: 'Build', subtitle: 'With Precision' },
  { icon: '✦', title: 'Create', subtitle: 'With Purpose' },
  { icon: '∞', title: 'Sustain', subtitle: 'For Generations' },
] as const;

export default function AuthLoginHero() {
  return (
    <section className="vish-login-page__hero" aria-label="Vishvakarma.OS brand story">
      <div className="vish-login-page__brand-mark">
        <div className="vish-login-page__om" aria-hidden="true">
          ॐ
        </div>
        <div className="vish-login-page__brand-title">Vishvakarma</div>
        <div className="vish-login-page__brand-subtitle">
          The Divine Architect
          <br />
          of All Creation
        </div>
      </div>

      <div className="vish-login-page__deity-visual" aria-hidden="true">
        <div className="vish-login-page__deity-glow" />
        <div className="vish-login-page__trident">
          <div className="vish-login-page__trident-prong vish-login-page__trident-prong--left" />
          <div className="vish-login-page__trident-prong vish-login-page__trident-prong--center" />
          <div className="vish-login-page__trident-prong vish-login-page__trident-prong--right" />
          <div className="vish-login-page__trident-shaft" />
        </div>
        <div className="vish-login-page__crescent" />
        <div className="vish-login-page__deity-face" />
      </div>

      <div className="vish-login-page__features">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="vish-login-page__feature">
            <div className="vish-login-page__feature-icon" aria-hidden="true">
              {feature.icon}
            </div>
            <div>
              <strong>{feature.title}</strong>
              <span>{feature.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <blockquote className="vish-login-page__quote">
        <div className="vish-login-page__quote-sanskrit">यत्र विश्वं भवत्येकनीडम्</div>
        <p>Where the world becomes one nest.</p>
        <small>— Atharva Veda</small>
      </blockquote>
    </section>
  );
}
