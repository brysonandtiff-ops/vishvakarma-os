import type { BackendMode, EnvSource } from './backendTypes';

const SUPABASE_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

/**
 * Public client-side Supabase configuration for the production Vishvakarma.OS project.
 *
 * These values are publishable browser client values, not service-role secrets. They keep
 * the public app connected when Vercel preview/production env vars are missing or still
 * set to placeholders. Explicit env vars always win when real values are provided.
 */
export const PUBLIC_SUPABASE_URL = 'https://jyocvwipthswfcmvqgqe.supabase.co';
export const PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_2vZsi4PoOlDb2lqs9mV0QQ_peQDtE6b';

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

export function resolveSupabaseConfig(env: EnvSource = import.meta.env) {
  const envUrl = envString(env, 'VITE_SUPABASE_URL');
  const envAnonKey = envString(env, 'VITE_SUPABASE_ANON_KEY');

  const url = isPlaceholderValue(envUrl) ? PUBLIC_SUPABASE_URL : envUrl;
  const anonKey = isPlaceholderValue(envAnonKey) ? PUBLIC_SUPABASE_ANON_KEY : envAnonKey;

  const missingKeys = SUPABASE_KEYS.filter((key) => {
    const resolvedValue = key === 'VITE_SUPABASE_URL' ? url : anonKey;
    return isPlaceholderValue(resolvedValue);
  });

  return {
    url,
    anonKey,
    missingKeys,
    usedPublicFallback: isPlaceholderValue(envUrl) || isPlaceholderValue(envAnonKey),
  };
}

export function getBackendStatus(env: EnvSource = import.meta.env) {
  const { missingKeys } = resolveSupabaseConfig(env);
  const isConfigured = missingKeys.length === 0;

  return {
    provider: 'supabase' as const,
    isConfigured,
    mode: (isConfigured ? 'connected' : 'local-only') as BackendMode,
    missingKeys: [...missingKeys],
    configurationError: isConfigured
      ? null
      : `Supabase backend is not configured. Missing real values for: ${missingKeys.join(', ')}. Set ${SUPABASE_KEYS.join(', ')}.`,
  };
}

export const backendStatus = getBackendStatus();
export const activeBackendProvider = backendStatus.provider;

export function isSupabaseBackend(_env: EnvSource = import.meta.env) {
  return true;
}
