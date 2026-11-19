import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VishArchitecturalSequence } from '@/components/brand/VishArchitecturalSequence';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Vishvakarma.OS cinematic entrance', () => {
  it('preserves the official owner-supplied swan artwork on welcome and loading stages', () => {
    const welcome = renderToStaticMarkup(<VishArchitecturalSequence variant="welcome" />);
    const loading = renderToStaticMarkup(<VishArchitecturalSequence variant="loading" />);
    expect(welcome).toContain('/brand/vishvakarma-official-logo.svg');
    expect(loading).toContain('/brand/vishvakarma-official-logo.svg');
    expect(welcome).toContain('Sketch your home');
    expect(welcome).toContain('See it in 3D');
    expect(welcome).toContain('Explore every room');
  });

  it('marks genuine lazy-route loading as accessible indeterminate status, never a fake percentage', () => {
    const html = renderToStaticMarkup(
      <VishArchitecturalSequence variant="loading" message="Opening the blueprint editor…" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Opening the blueprint editor');
    expect(html).not.toContain('% complete');
  });

  it('ties auth buffering feedback to the real submitting state', () => {
    const auth = read('src/components/auth/AuthLoginCard.tsx');
    expect(auth).toContain('{submitting && (');
    expect(auth).toContain('aria-busy={submitting}');
    expect(auth).toContain('vish-auth-connection__activity');
  });

  it('never waits for window.load or a cinematic delay before revealing the app', () => {
    const index = read('index.html');
    expect(index).toContain('id="boot-splash"');
    expect(index).toContain('/brand/vishvakarma-official-logo.svg');
    expect(index).toContain('MutationObserver');
    expect(index).toContain('requestAnimationFrame');
    expect(index).not.toContain("window.addEventListener('load'");
  });

  it('supports reduced motion and retains all private-route auth gates', () => {
    const css = read('src/styles/vish-architecture-cinematics.css');
    const routes = read('src/AppRoutes.tsx');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('animation: none !important');
    expect(routes).toContain('<AuthLayout />');
    expect(routes).toContain('AppLayoutOutlet');
  });
});
