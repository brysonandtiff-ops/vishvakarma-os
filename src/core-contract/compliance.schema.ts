/**
 * Compliance gate contract — inputs/outputs for NCC stub audit layer.
 */

import type { ComplianceAuditReport, ComplianceCategorySummary } from '@/modules/compliance/types';
import type { ComplianceCategory, ComplianceResult, ComplianceStatus } from '@/rules/types';

export type {
  ComplianceAuditReport,
  ComplianceCategorySummary,
  ComplianceCategory,
  ComplianceResult,
  ComplianceStatus,
};

export const COMPLIANCE_GATE_VERSION = '1.0.0';

export const COMPLIANCE_RULE_COUNT = 12;

export const COMPLIANCE_RULE_IDS = [
  'ncc-bedroom-size',
  'ncc-bedroom-egress',
  'ncc-habitable-height',
  'access-door-width',
  'access-circulation-width',
  'energy-thermal-comfort',
  'energy-glazing-ratio',
  'zoning-setback',
  'zoning-coverage',
  'fire-egress-path',
  'fire-smoke-alarm-zone',
  'zoning-council-conditions',
] as const;

export type ComplianceRuleId = (typeof COMPLIANCE_RULE_IDS)[number];

export interface ComplianceGateInput {
  manifest: import('@/types').ProjectManifest;
  projectId?: string;
  projectName?: string;
}

export interface ComplianceGateOutput {
  report: ComplianceAuditReport;
  exportAllowed: boolean;
}
