import type { BackendProvider, EnvSource } from './backendTypes';

const FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

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

export function getMissingFirebaseKeys(env: EnvSource) {
  return FIREBASE_KEYS.filter((key) => {
    const value = envString(env, key);
    return isPlaceholderValue(value);
  });
}

export function getMissingSupabaseKeys(env: EnvSource) {
  return SUPABASE_KEYS.filter((key) => {
    const value = envString(env, key);
    return isPlaceholderValue(value);
  });
}

export function resolveBackendProvider(env: EnvSource = import.meta.env): BackendProvider {
  const explicit = envString(env, 'VITE_BACKEND_PROVIDER').toLowerCase();
  if (explicit === 'supabase' || explicit === 'firebase') {
    return explicit;
  }

  const supabaseMissing = getMissingSupabaseKeys(env);
  const firebaseMissing = getMissingFirebaseKeys(env);

  if (supabaseMissing.length === 0) return 'supabase';
  if (firebaseMissing.length === 0) return 'firebase';
  return 'supabase';
}

export function getBackendStatus(env: EnvSource = import.meta.env) {
  const provider = resolveBackendProvider(env);
  const missing =
    provider === 'supabase' ? getMissingSupabaseKeys(env) : getMissingFirebaseKeys(env);
  const isConfigured = missing.length === 0;

  const providerLabel = provider === 'supabase' ? 'Supabase' : 'Firebase';
  const keyList =
    provider === 'supabase' ? SUPABASE_KEYS.join(', ') : FIREBASE_KEYS.join(', ');

  return {
    provider,
    isConfigured,
    mode: isConfigured ? ('connected' as const) : ('local-only' as const),
    missingKeys: [...missing],
    configurationError: isConfigured
      ? null
      : provider === 'supabase'
        ? `Supabase backend is not configured. Missing real values for: ${missing.join(', ')}. Set ${keyList}.`
        : `Firebase backend is not configured. Missing real values for: ${missing.join(', ')}. Set ${keyList}.`,
  };
}

export const backendStatus = getBackendStatus();
export const activeBackendProvider = backendStatus.provider;

export function isSupabaseBackend(env: EnvSource = import.meta.env) {
  return resolveBackendProvider(env) === 'supabase';
}
