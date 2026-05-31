import { describe, expect, it } from 'vitest';
import { PRICING_PAGE_ENABLED } from '@/config/marketingFeatures';
import routes from '@/routes';

describe('marketing routes', () => {
  it('includes public marketing paths', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/features');
    if (PRICING_PAGE_ENABLED) {
      expect(paths).toContain('/pricing');
    } else {
      expect(paths).not.toContain('/pricing');
    }
    expect(paths).toContain('/auth');
    expect(paths).toContain('/404');
  });

  it('keeps editor and workspace routes private', () => {
    const editor = routes.find((r) => r.path === '/editor');
    const projects = routes.find((r) => r.path === '/projects');
    expect(editor?.access).toBe('private');
    expect(projects?.access).toBe('private');
  });
});
