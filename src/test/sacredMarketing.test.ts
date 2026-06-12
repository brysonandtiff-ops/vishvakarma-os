import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Sacred marketing visuals', () => {
  it('uses SacredMandalaLayer on marketing SacredBackground', () => {
    const sacredBackground = read('src/components/marketing/SacredBackground.tsx');
    const mandalaLayer = read('src/components/marketing/SacredMandalaLayer.tsx');

    expect(sacredBackground).toContain('SacredMandalaLayer');
    expect(sacredBackground).not.toContain('vish-mandala-ring-static');
    expect(mandalaLayer).toContain('vish-mandala-svg--outer');
    expect(mandalaLayer).toContain('vish-mandala-svg--petals');
    expect(mandalaLayer).toContain('vish-mandala-bindu');
  });

  it('styles animated Devanagari hero text for marketing pages', () => {
    const marketingStyles = read('src/styles/vish-marketing.css');
    const pageHeader = read('src/components/marketing/MarketingPageHeader.tsx');
    const landingPage = read('src/pages/LandingPage.tsx');

    expect(marketingStyles).toContain('.vish-devanagari-hero');
    expect(marketingStyles).toContain('@keyframes vish-devanagari-breathe');
    expect(pageHeader).toContain('vish-devanagari-hero');
    expect(pageHeader).not.toContain('vish-marketing-section-label vish-devanagari-accent');
    expect(landingPage).toContain('vish-devanagari-hero');
  });

  it('defines mandala SVG layers and marketing ring sizing in sacred layers CSS', () => {
    const layers = read('src/styles/vish-sacred-layers.css');

    expect(layers).toContain('.vish-mandala-svg--outer');
    expect(layers).toContain('.vish-mandala-svg--petals');
    expect(layers).toContain('.vish-mandala-bindu');
    expect(layers).toContain('@keyframes vish-mandala-bindu-pulse');
    expect(layers).toContain('@keyframes vish-mandala-aura-glow');
    expect(layers).toContain('.vish-mandala-ring--marketing');
    expect(layers).toContain('repeating-conic-gradient');
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
