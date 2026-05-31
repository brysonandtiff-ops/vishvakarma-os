import type { BackendProvider, BackendStatus } from './backendTypes';

type EnvSource = Record<string, unknown>;

const SUPABASE_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
const FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

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

export function normalizeBackendProvider(value: unknown): BackendProvider {
  return value === 'firebase' ? 'firebase' : 'supabase';
}

export function getMissingBackendKeys(provider: BackendProvider, env: EnvSource) {
  const keys = provider === 'firebase' ? FIREBASE_KEYS : SUPABASE_KEYS;

  return keys.filter((key) => {
    const value = envString(env, key);
    return isPlaceholderValue(value);
  });
}

export function getBackendStatus(env: EnvSource = import.meta.env): BackendStatus {
  const provider = normalizeBackendProvider(envString(env, 'VITE_BACKEND_PROVIDER'));
  const missing = getMissingBackendKeys(provider, env);
  const isConfigured = missing.length === 0;

  return {
    provider,
    isConfigured,
    mode: isConfigured ? 'connected' : 'local-only',
    missingKeys: missing,
    configurationError: isConfigured
      ? null
      : `${provider} backend is not configured. Missing real values for: ${missing.join(', ')}`,
  };
}

export const backendStatus = getBackendStatus();
export const activeBackendProvider = backendStatus.provider;
