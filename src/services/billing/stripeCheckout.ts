import { getSupabaseAccessToken } from '@/backend/supabase/supabaseAccessToken';

type StripeApiResponse = {
  url?: string;
  error?: string;
};

export type CheckoutPlan = 'studio' | 'enterprise';

const STRIPE_REDIRECT_HOSTS = new Set([
  'checkout.stripe.com',
  'billing.stripe.com',
]);

export function validateStripeRedirectUrl(value: string): string {
  const url = new URL(value);
  const allowedHost =
    STRIPE_REDIRECT_HOSTS.has(url.hostname) || url.hostname.endsWith('.stripe.com');

  if (url.protocol !== 'https:' || !allowedHost || url.username || url.password) {
    throw new Error('Stripe API returned an untrusted redirect URL');
  }

  return url.toString();
}

async function postStripeApi(
  path: string,
  body: Record<string, unknown> = {}
): Promise<string> {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error('Your secure session is unavailable. Sign in again and retry.');
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin: window.location.origin, ...body }),
  });

  const payload = (await response.json()) as StripeApiResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? `Stripe API request failed (${response.status})`);
  }
  if (!payload.url) {
    throw new Error('Stripe API response missing redirect URL');
  }
  return validateStripeRedirectUrl(payload.url);
}

export async function startCheckout(plan: CheckoutPlan = 'studio'): Promise<void> {
  const url = await postStripeApi('/api/stripe/create-checkout-session', { plan });
  window.location.assign(url);
}

export async function startStudioCheckout(): Promise<void> {
  await startCheckout('studio');
}

export async function startEnterpriseCheckout(): Promise<void> {
  await startCheckout('enterprise');
}

export async function openBillingPortal(): Promise<void> {
  const url = await postStripeApi('/api/stripe/create-portal-session');
  window.location.assign(url);
}
