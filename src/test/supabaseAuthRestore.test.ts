import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Supabase-only backend wiring', () => {
  it('exports approved Supabase email/password auth without Firebase or copied tokens', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const backendConfig = read('src/backend/backendConfig.ts');
    const supabaseAuth = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authContext).toContain('SupabaseAuthProvider as AuthProvider');
    expect(authContext).not.toContain('FirebaseAuthProvider');
    expect(backendConfig).toContain('VITE_SUPABASE_URL');
    expect(backendConfig).toContain("provider: 'supabase'");
    expect(supabaseAuth).toContain('signInWithPasswordSupabase');
    expect(supabaseAuth).toContain('client.auth.signInWithPassword');
    expect(supabaseAuth).toContain('client.auth.resetPasswordForEmail');
    expect(supabaseAuth).toContain('buildAuthorizedSessionOrSignOut');
    expect(supabaseAuth).toContain('clearLegacyTokenSnapshot');
    expect(supabaseAuth).toContain('Supabase remains the single');
    expect(supabaseAuth).not.toContain('Password sign-in is disabled');
    expect(supabaseAuth).not.toContain('idToken: string;');
    expect(supabaseAuth).not.toContain('refreshToken: string;');
    expect(supabaseAuth).not.toContain('storage.setItem(SUPABASE_SESSION_KEY');
  });

  it('routes db/api directly through Supabase gateways', () => {
    const api = read('src/db/api.ts');

    expect(api).toContain('getSupabaseProjects');
    expect(api).toContain('createSupabaseProject');
    expect(api).not.toContain('getFirestoreProjects');
    expect(api).not.toContain('isSupabaseBackend');
  });
});
