import { Compass, Hammer, Sparkles, Leaf } from 'lucide-react';

const FEATURES = [
  { icon: Compass, title: 'Design', subtitle: 'With Intelligence' },
  { icon: Hammer, title: 'Build', subtitle: 'With Precision' },
  { icon: Sparkles, title: 'Create', subtitle: 'With Purpose' },
  { icon: Leaf, title: 'Sustain', subtitle: 'For Generations' },
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
        <picture>
<source srcSet="/deity-hero.avif" type="image/avif" />
<img
          src="/deity-hero.png"
          alt=""
          className="vish-login-page__deity-img"
          width={800}
          height={600}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
</picture>
        <div className="vish-login-page__deity-glow" />
      </div>

      <div className="vish-login-page__features">
        {FEATURES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="vish-login-page__feature">
            <div className="vish-login-page__feature-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <div>
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <blockquote className="vish-login-page__quote">
        <div className="vish-login-page__quote-sanskrit">यत्र विश्वं भवत्येकनीडम्</div>
        <p>&ldquo;Where the world becomes one nest&rdquo;</p>
        <small>— Atharva Veda</small>
      </blockquote>
    </section>
  );
}


