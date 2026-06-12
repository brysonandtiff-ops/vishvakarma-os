import type { BackendMode, EnvSource } from './backendTypes';

const SUPABASE_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

function envString(env: EnvSource, key: string) {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholderValue(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.length === 0 ||
    normalized.includes('your-') ||
    normalized.includes('placeholder') ||
    normalized.includes('example.com')
  );
}

export function getMissingSupabaseKeys(env: EnvSource) {
  return SUPABASE_KEYS.filter((key) => {
    const value = envString(env, key);
    return isPlaceholderValue(value);
  });
}

export function getBackendStatus(env: EnvSource = import.meta.env) {
  const missing = getMissingSupabaseKeys(env);
  const isConfigured = missing.length === 0;

  return {
    provider: 'supabase' as const,
    isConfigured,
    mode: (isConfigured ? 'connected' : 'local-only') as BackendMode,
    missingKeys: [...missing],
    configurationError: isConfigured
      ? null
      : `Supabase backend is not configured. Missing real values for: ${missing.join(', ')}. Set ${SUPABASE_KEYS.join(', ')}.`,
  };
}

export const backendStatus = getBackendStatus();
export const activeBackendProvider = backendStatus.provider;

export function isSupabaseBackend(_env: EnvSource = import.meta.env) {
  return true;
}
