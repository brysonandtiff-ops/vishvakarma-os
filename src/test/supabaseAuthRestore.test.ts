import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('Supabase auth restore wiring', () => {
  it('selects Supabase provider in AuthProvider when configured', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const backendConfig = read('src/backend/backendConfig.ts');
    const supabaseAuth = read('src/backend/supabase/supabaseAuthGateway.ts');

    expect(authContext).toContain("backendStatus.provider === 'supabase'");
    expect(authContext).toContain('SupabaseAuthProvider');
    expect(backendConfig).toContain('VITE_SUPABASE_URL');
    expect(backendConfig).toContain('resolveBackendProvider');
    expect(supabaseAuth).toContain('requestSupabaseAccessLink');
    expect(supabaseAuth).toContain('signInWithOtp');
  });

  it('routes db/api through Supabase gateways when provider is supabase', () => {
    const api = read('src/db/api.ts');

    expect(api).toContain('isSupabaseBackend');
    expect(api).toContain('getSupabaseProjects');
    expect(api).toContain('createSupabaseProject');
  });
});
