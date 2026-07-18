import Stripe from 'stripe';

function createStripeClient(secretKey: string) {
  return new Stripe(secretKey);
}

export type StripeClient = ReturnType<typeof createStripeClient>;

let stripeClient: StripeClient | null = null;

export type CheckoutPlan = 'studio' | 'enterprise';

export function getStripeClient(): StripeClient {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = createStripeClient(secretKey);
  return stripeClient;
}

export function getStudioPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_STUDIO_MONTHLY?.trim();
  if (!priceId) {
    throw new Error('STRIPE_PRICE_STUDIO_MONTHLY is not configured');
  }
  return priceId;
}

export function getEnterprisePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim();
  if (!priceId) {
    throw new Error('STRIPE_PRICE_ENTERPRISE_MONTHLY is not configured');
  }
  return priceId;
}

export function getPriceIdForPlan(plan: CheckoutPlan): string {
  return plan === 'enterprise' ? getEnterprisePriceId() : getStudioPriceId();
}

export function planFromPriceId(priceId: string | null | undefined): CheckoutPlan | 'starter' {
  if (!priceId) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_STUDIO_MONTHLY?.trim()) return 'studio';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim()) return 'enterprise';
  return 'starter';
}
