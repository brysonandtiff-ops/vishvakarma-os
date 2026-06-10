type StripeApiResponse = {
  url?: string;
  error?: string;
};

export type CheckoutPlan = 'studio' | 'enterprise';

async function postStripeApi(
  path: string,
  idToken: string,
  body: Record<string, unknown> = {}
): Promise<string> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
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
  return payload.url;
}

export async function startCheckout(idToken: string, plan: CheckoutPlan = 'studio'): Promise<void> {
  const url = await postStripeApi('/api/stripe/create-checkout-session', idToken, { plan });
  window.location.assign(url);
}

export async function startStudioCheckout(idToken: string): Promise<void> {
  await startCheckout(idToken, 'studio');
}

export async function startEnterpriseCheckout(idToken: string): Promise<void> {
  await startCheckout(idToken, 'enterprise');
}

export async function openBillingPortal(idToken: string): Promise<void> {
  const url = await postStripeApi('/api/stripe/create-portal-session', idToken);
  window.location.assign(url);
}
