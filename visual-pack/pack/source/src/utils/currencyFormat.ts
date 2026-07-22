import type { RegionalCostIndex } from '@/domain/cost/types';

export function formatCurrency(amount: number, currency: RegionalCostIndex['currency'] = 'USD'): string {
  if (currency === 'INR') {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
  if (currency === 'AUD') {
    return `A$${Math.round(amount).toLocaleString('en-AU')}`;
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export function currencySymbol(currency: RegionalCostIndex['currency']): string {
  if (currency === 'INR') return '₹';
  if (currency === 'AUD') return 'A$';
  return '$';
}
