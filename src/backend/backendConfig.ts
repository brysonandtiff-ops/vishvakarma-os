import type { EnvSource } from './backendTypes';

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

export function getMissingBackendKeys(env: EnvSource) {
  return FIREBASE_KEYS.filter((key) => {
    const value = envString(env, key);
    return isPlaceholderValue(value);
  });
}

export function getBackendStatus(env: EnvSource = import.meta.env) {
  const missing = getMissingBackendKeys(env);
  const isConfigured = missing.length === 0;

  return {
    provider: 'firebase' as const,
    isConfigured,
    mode: isConfigured ? ('connected' as const) : ('local-only' as const),
    missingKeys: [...missing],
    configurationError: isConfigured
      ? null
      : `Firebase backend is not configured. Missing real values for: ${missing.join(', ')}`,
  };
}

export const backendStatus = getBackendStatus();
export const activeBackendProvider = backendStatus.provider;
