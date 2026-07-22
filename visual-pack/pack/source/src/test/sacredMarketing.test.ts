import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Sacred marketing visuals', () => {
  it('uses SacredMandalaLayer and SacredCosmicLayer on marketing SacredBackground', () => {
    const sacredBackground = read('src/components/marketing/SacredBackground.tsx');
    const mandalaLayer = read('src/components/marketing/SacredMandalaLayer.tsx');
    const cosmicLayer = read('src/components/marketing/SacredCosmicLayer.tsx');

    expect(sacredBackground).toContain('SacredMandalaLayer');
    expect(sacredBackground).toContain('SacredCosmicLayer');
    expect(sacredBackground).toContain('showCosmic');
    expect(sacredBackground).not.toContain('vish-mandala-ring-static');
    expect(mandalaLayer).toContain('vish-mandala-svg--outer');
    expect(mandalaLayer).toContain('vish-mandala-svg--petals');
    expect(mandalaLayer).toContain('vish-mandala-svg--glyph');
    expect(mandalaLayer).toContain('vish-mandala-spires');
    expect(mandalaLayer).toContain('vish-mandala-spike');
    expect(mandalaLayer).toContain('vish-mandala-bindu');
    expect(cosmicLayer).toContain('vish-sacred-cosmic-canvas');
  });

  it('styles animated Devanagari hero text for marketing pages', () => {
    const marketingStyles = read('src/styles/vish-marketing.css');
    const pageHeader = read('src/components/marketing/MarketingPageHeader.tsx');
    const landingPage = read('src/pages/LandingPage.tsx');

    expect(marketingStyles).toContain('.vish-devanagari-hero');
    expect(marketingStyles).toContain('@keyframes vish-devanagari-breathe');
    expect(pageHeader).toContain('vish-devanagari-hero');
    expect(pageHeader).not.toContain('vish-marketing-section-label vish-devanagari-accent');
    expect(landingPage).toContain('MarketingPageHeader');
    expect(landingPage).toContain('MarketingCtaSection');
  });

  it('defines mandala SVG layers and marketing ring sizing in sacred layers CSS', () => {
    const layers = read('src/styles/vish-sacred-layers.css');

    expect(layers).toContain('.vish-mandala-svg--outer');
    expect(layers).toContain('.vish-mandala-svg--petals');
    expect(layers).toContain('.vish-mandala-svg--glyph');
    expect(layers).toContain('.vish-mandala-bindu');
    expect(layers).toContain('@keyframes vish-mandala-bindu-pulse');
    expect(layers).toContain('@keyframes vish-mandala-aura-glow');
    expect(layers).toContain('@keyframes vish-mandala-spire-glow');
    expect(layers).toContain('@keyframes vish-mandala-glyph-shimmer');
    expect(layers).toContain('@keyframes vish-mandala-spike-pulse');
    expect(layers).toContain('@keyframes vish-cosmic-nebula-drift');
    expect(layers).toContain('.vish-sacred-cosmic-canvas');
    expect(layers).toContain('.vish-mandala-ring--marketing');
    expect(layers).toContain('repeating-conic-gradient');
  });

  it('anchors PageSection copy on a stable marketing intro panel', () => {
    const pageSection = read('src/components/common/PageSection.tsx');
    const marketingStyles = read('src/styles/vish-marketing.css');
    const landingPage = read('src/pages/LandingPage.tsx');

    expect(pageSection).toContain('vish-page-section-intro');
    expect(pageSection).toContain('vish-page-section-title');
    expect(pageSection).toContain('vish-page-section-description');
    expect(pageSection).toContain('vish-text-heading');
    expect(pageSection).toContain('vish-text-body');
    expect(pageSection).not.toContain('text-foreground/85');
    expect(marketingStyles).toContain('.vish-marketing-page .vish-page-section-intro');
    expect(marketingStyles).toContain('.vish-marketing-page .vish-workflow-strip');
    expect(landingPage).toContain('vish-workflow-strip');
    expect(landingPage).not.toContain('ArrowRight');
  });

  it('bumps marketing Sanskrit rain preset visibility', () => {
    const rainBackground = read('src/components/common/SanskritRainBackground.tsx');
    const marketingStyles = read('src/styles/vish-marketing.css');

    expect(rainBackground).toContain('density: 85');
    expect(rainBackground).toContain('opacity: 0.14');
    expect(rainBackground).toContain('streamCount: 7');
    expect(rainBackground).toContain('emberCount: 10');
    expect(rainBackground).toContain('? 0.58 : 0.52');
    expect(rainBackground).toContain('? 13.5 : 13');
    expect(marketingStyles).toContain('opacity: 0.68');
    expect(marketingStyles).toContain('brightness(1.06)');
  });
});
