export type StripeMetadataShape = Record<string, string>;

export type StripeExpandableId = string | { id: string } | null | undefined;

export type StripeSubscriptionShape = {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata?: StripeMetadataShape | null;
  trial_end?: number | null;
  items: {
    data: Array<{
      current_period_end?: number | null;
      price?: { id?: string | null } | null;
    }>;
  };
};

export type StripeCheckoutSessionShape = {
  customer?: StripeExpandableId;
  subscription?: StripeExpandableId;
  client_reference_id?: string | null;
  metadata?: StripeMetadataShape | null;
};

export type StripeInvoiceShape = {
  customer?: StripeExpandableId;
  metadata?: StripeMetadataShape | null;
  parent?: {
    subscription_details?: {
      subscription?: StripeExpandableId;
    } | null;
  } | null;
};

export function expandableId(value: StripeExpandableId): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}
