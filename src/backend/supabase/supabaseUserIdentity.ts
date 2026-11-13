import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupportedSupabaseUser } from '@/backend/supabase/supabaseAuthGateway';

/** Verify the SDK's current user without reading legacy session/token storage. */
export async function getCurrentSupabaseUserId(client: SupabaseClient | null): Promise<string | null> {
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser();
    const user = data.user;
    if (error || !user?.id || user.is_anonymous || !isSupportedSupabaseUser(user)) {
      return null;
    }
    return user.id;
  } catch {
    return null;
  }
}
