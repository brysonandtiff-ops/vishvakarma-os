import { getSupabaseClient } from './supabaseClient';

/**
 * Returns the current Supabase access token for the signed-in user, or null when there is
 * no client/session. Used to authorize calls to server routes (e.g. `/api/ai/*`). Never
 * throws — callers degrade to unauthenticated behavior when this is null.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
