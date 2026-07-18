import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Supabase-only backend wiring', () => {
  it('exports approved Google and email Supabase auth without Firebase or passwords', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const backendConfig = read('src/backend/backendConfig.ts');
    const supabaseAuth = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authContext).toContain('SupabaseAuthProvider as AuthProvider');
    expect(authContext).not.toContain('FirebaseAuthProvider');
    expect(backendConfig).toContain('VITE_SUPABASE_URL');
    expect(backendConfig).toContain("provider: 'supabase'");
    expect(supabaseAuth).toContain("SUPPORTED_AUTH_PROVIDERS = ['google', 'email']");
    expect(supabaseAuth).toContain('requestSupabaseAccessLink');
    expect(supabaseAuth).toContain('client.auth.signInWithOtp');
    expect(supabaseAuth).toContain('shouldCreateUser: false');
    expect(supabaseAuth).toContain('client.auth.verifyOtp');
    expect(supabaseAuth).not.toContain('client.auth.signInWithPassword');
    expect(supabaseAuth).toContain('isSupabaseOAuthCallback');
    expect(supabaseAuth).toContain('isSupabaseEmailLinkCallback');
  });

  it('routes db/api directly through Supabase gateways', () => {
    const api = read('src/db/api.ts');

    expect(api).toContain('getSupabaseProjects');
    expect(api).toContain('createSupabaseProject');
    expect(api).not.toContain('getFirestoreProjects');
    expect(api).not.toContain('isSupabaseBackend');
  });
});
