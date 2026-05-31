import { describe, expect, it } from 'vitest';
import routes from '@/routes';

describe('marketing routes', () => {
  it('includes public marketing paths', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/features');
    expect(paths).toContain('/pricing');
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
