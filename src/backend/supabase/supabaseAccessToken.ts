import { getSupabaseClient } from './supabaseClient';

type SupabaseSessionReader = {
  getSession: () => Promise<{
    data: { session: { access_token?: string | null } | null };
    error?: unknown;
  }>;
};

/**
 * Returns the current Supabase access token for the signed-in user, or null when there is
 * no client/session. Used to authorize calls to server routes (e.g. `/api/ai/*`). Never
 * throws — callers degrade to unauthenticated behavior when this is null.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const auth = client.auth as unknown as SupabaseSessionReader;
    const { data } = await auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
