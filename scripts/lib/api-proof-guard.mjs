/**
 * API diagnostics may create temporary test data ONLY with deliberate opt-in
 * and an explicitly selected test profile. Never use an arbitrary real user.
 */
export function validateApiProofTarget(args, env) {
  if (!args.includes('--api-only') || !args.includes('--allow-live-test-data-write')) {
    return { ok: false, reason: 'API writes require explicit --api-only --allow-live-test-data-write.' };
  }
  const userId = typeof env.SUPABASE_PROOF_USER_ID === 'string'
    ? env.SUPABASE_PROOF_USER_ID.trim()
    : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return { ok: false, reason: 'Set SUPABASE_PROOF_USER_ID to the dedicated test profile UUID.' };
  }
  return { ok: true, userId };
}
