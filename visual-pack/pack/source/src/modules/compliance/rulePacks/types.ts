import type { ComplianceCategory } from '@/rules/types';

/** Decision-support citation — not a certified NCC legal opinion. */
export interface ComplianceCitation {
  code: string;
  clause?: string;
  summary: string;
  sourceUrl?: string;
}

export interface RulePackEntry {
  ruleId: string;
  category: ComplianceCategory;
  citation: ComplianceCitation;
  thresholdKey?: string;
}

export interface ComplianceRulePack {
  id: string;
  jurisdiction: 'au' | 'in';
  version: string;
  title: string;
  disclaimer: string;
  entries: RulePackEntry[];
}
