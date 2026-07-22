import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Supabase-only backend wiring', () => {
  it('exports Supabase AuthProvider without Firebase branching', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const backendConfig = read('src/backend/backendConfig.ts');
    const supabaseAuth = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authContext).toContain('SupabaseAuthProvider as AuthProvider');
    expect(authContext).not.toContain('FirebaseAuthProvider');
    expect(backendConfig).toContain('VITE_SUPABASE_URL');
    expect(backendConfig).toContain("provider: 'supabase'");
    expect(supabaseAuth).toContain('requestSupabaseAccessLink');
    expect(supabaseAuth).toContain('signInWithOtp');
    expect(supabaseAuth).toContain('isSupabaseOAuthCallback');
  });

  it('routes db/api directly through Supabase gateways', () => {
    const api = read('src/db/api.ts');

    expect(api).toContain('getSupabaseProjects');
    expect(api).toContain('createSupabaseProject');
    expect(api).not.toContain('getFirestoreProjects');
    expect(api).not.toContain('isSupabaseBackend');
  });
});
