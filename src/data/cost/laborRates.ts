import type { LaborRate } from '@/domain/cost/types';

export const LABOR_RATES: LaborRate[] = [
  { tradeCode: 'carpentry', label: 'Carpentry', hourlyRate: 78, productivityFactor: 1 },
  { tradeCode: 'concrete', label: 'Concrete', hourlyRate: 85, productivityFactor: 1 },
  { tradeCode: 'glazing', label: 'Glazing', hourlyRate: 92, productivityFactor: 1 },
  { tradeCode: 'roofing', label: 'Roofing', hourlyRate: 88, productivityFactor: 1 },
  { tradeCode: 'plaster', label: 'Plaster', hourlyRate: 72, productivityFactor: 1 },
  { tradeCode: 'site', label: 'Site works', hourlyRate: 80, productivityFactor: 1 },
];

export const LABOR_RATES_BY_TRADE = new Map(LABOR_RATES.map((rate) => [rate.tradeCode, rate]));
