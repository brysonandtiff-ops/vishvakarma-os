import type { Project } from '@/types';

export type ComplianceCategory = 'ncc' | 'accessibility' | 'energy' | 'zoning' | 'fire';

export type ComplianceStatus = 'pass' | 'warning' | 'fail';

export interface ComplianceFinding {
  ruleId: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  message: string;
  roomId?: string;
  field?: string;
}

export interface ComplianceResult {
  ruleId: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  description: string;
  findings: ComplianceFinding[];
}

export interface ComplianceRule {
  id: string;
  description: string;
  category: ComplianceCategory;
  validate(project: Project): ComplianceResult;
}

export function worstStatus(a: ComplianceStatus, b: ComplianceStatus): ComplianceStatus {
  if (a === 'fail' || b === 'fail') return 'fail';
  if (a === 'warning' || b === 'warning') return 'warning';
  return 'pass';
}

export function statusFromFindings(findings: ComplianceFinding[]): ComplianceStatus {
  if (findings.some((f) => f.status === 'fail')) return 'fail';
  if (findings.some((f) => f.status === 'warning')) return 'warning';
  return 'pass';
}
