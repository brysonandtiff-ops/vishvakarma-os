import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANONICAL_ORIGIN, CANONICAL_WWW_ORIGIN } from '@/config/canonicalOrigin';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const oldProvider = ['ver', 'cel'].join('');

describe('Vishvakarma.OS canonical Cloudflare hosting migration', () => {
  it('binds canonical and WWW only to the actual active Cloudflare custom domain', () => {
    expect(CANONICAL_ORIGIN).toBe('https://vishvakarmaos.app');
    expect(CANONICAL_WWW_ORIGIN).toBe('https://www.vishvakarmaos.app');
    const supabase = read('supabase/config.toml');
    expect(supabase).toContain('site_url = "https://vishvakarmaos.app"');
    expect(supabase).toContain('"https://www.vishvakarmaos.app/auth"');
  });

  it('removes retired origins from the real-time server default allowlist', () => {
    const server = read('server/collab/presenceServer.ts');
    expect(server).toContain("'https://vishvakarmaos.app'");
    expect(server).toContain("'https://www.vishvakarmaos.app'");
    expect(server).toContain("'https://vishvakarma-os.pages.dev'");
    expect(server.toLowerCase()).not.toContain(oldProvider);
  });

  it('ensures the Cloudflare-only gate covers the actual active credential and server surfaces', () => {
    const guard = read('scripts/quality/check-cloudflare-only.mjs');
    for (const prefix of ["'server/'", "'.vscode/settings.json'", "'.env.example'", "'AGENTS.md'"]) {
      expect(guard).toContain(prefix);
    }
    expect(read('.vscode/settings.json').toLowerCase()).not.toContain(oldProvider);
    expect(read('.github/workflows/README.md').toLowerCase()).not.toContain(oldProvider);
  });

  it('does not mistake live deployment reachability for certified release', () => {
    const docs = read('docs/CURRENT_PRODUCTION_ARCHITECTURE.md');
    expect(docs).toContain('PRODUCTION/RELEASE HOLD');
    expect(docs).toContain('5a1305928ca9435e577ea2e021935452f9289a02');
    expect(docs).toContain('5c66a6604706282e0668c2b07d7a395e2d8570b7');
    expect(docs.toLowerCase()).toContain('security incident');
    expect(docs.toLowerCase()).toContain('backup/recovery');
  });
});
