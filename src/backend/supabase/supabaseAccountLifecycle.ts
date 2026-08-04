import type { Session } from '@supabase/supabase-js';
import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

export const MIN_ACCOUNT_PASSWORD_LENGTH = 12;

function configuredClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      backendStatus.configurationError ?? 'Supabase backend is not configured.',
    );
  }
  return client;
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  return normalized;
}

export function validateAccountPassword(password: string) {
  if (password.length < MIN_ACCOUNT_PASSWORD_LENGTH) {
    return `Use at least ${MIN_ACCOUNT_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  return null;
}

export async function createSupabaseAccount(
  email: string,
  password: string,
  emailRedirectTo: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const passwordError = validateAccountPassword(password);
  if (passwordError) throw new Error(passwordError);

  const client = configuredClient();
  const { data, error } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;

  return {
    session: data.session,
    user: data.user,
    needsEmailConfirmation: data.session === null,
  };
}

export async function sendSupabasePasswordRecovery(
  email: string,
  redirectTo: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const client = configuredClient();
  const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });
  if (error) throw error;
}

function stripRecoveryCodeFromUrl() {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, '/reset-password');
}

export async function resolveSupabaseRecoverySession(): Promise<Session | null> {
  const client = configuredClient();

  if (typeof window !== 'undefined') {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
      stripRecoveryCodeFromUrl();
      if (data.session) return data.session;
    }
  }

  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function updateSupabaseAccountPassword(password: string) {
  const passwordError = validateAccountPassword(password);
  if (passwordError) throw new Error(passwordError);

  const client = configuredClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) {
    throw new Error('Open the newest password-recovery link from your email first.');
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOutAfterPasswordRecovery() {
  const client = configuredClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
