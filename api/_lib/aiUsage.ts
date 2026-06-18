import { createClient } from '@supabase/supabase-js';
import type { PlanTier } from '../../src/config/billingPlans';
import { dailyAiLimit } from '../../src/config/aiUsage';

export type AiQuotaResult = { allowed: boolean; used: number; limit: number };

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Increments today's AI-call counter for a user and reports whether they remain within
 * their tier's daily ceiling. Fails OPEN (allowed) when the usage store is unavailable so
 * a transient DB issue never blocks the product — the auth gate and Gemini key are the
 * primary cost controls; this is the per-user throttle on top.
 */
export async function consumeAiQuota(uid: string, tier: PlanTier): Promise<AiQuotaResult> {
  const limit = dailyAiLimit(tier);
  const admin = getSupabaseAdmin();
  if (!admin) return { allowed: true, used: 0, limit };

  try {
    const { data, error } = await admin.rpc('increment_ai_usage', { p_user_id: uid });
    if (error || typeof data !== 'number') {
      return { allowed: true, used: 0, limit };
    }
    return { allowed: data <= limit, used: data, limit };
  } catch {
    return { allowed: true, used: 0, limit };
  }
}
