import type { ComplianceCategory, ComplianceResult, ComplianceStatus } from '@/rules/types';

export interface ComplianceCategorySummary {
  category: ComplianceCategory;
  label: string;
  status: ComplianceStatus;
  icon: 'check' | 'warn' | 'x';
}

export interface ComplianceAuditReport {
  projectId: string;
  projectName: string;
  overall: ComplianceStatus;
  categories: ComplianceCategorySummary[];
  results: ComplianceResult[];
  auditedAt: string;
  blocked: boolean;
  /** Decision-support disclaimer for jurisdiction rule pack. */
  disclaimer?: string;
}
