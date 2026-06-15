import type { ComplianceCategory } from '@/rules/types';

export type ArchitectureIssueSeverity = 'fail' | 'warning' | 'info';

export type ArchitectureIssueCategory =
  | ComplianceCategory
  | 'structure'
  | 'session'
  | 'export';

export type ArchitectureNavigateTarget = 'compliance' | 'copilot';

export interface ArchitectureIssue {
  id: string;
  title: string;
  message: string;
  severity: ArchitectureIssueSeverity;
  category: ArchitectureIssueCategory;
  autoFixable: boolean;
  ruleId?: string;
  roomId?: string;
  wallId?: string;
  openingId?: string;
  navigateTo?: ArchitectureNavigateTarget;
}

export interface RepairActionResult {
  issueId: string;
  applied: boolean;
  description: string;
  escalated?: boolean;
}

export interface RepairSummary {
  applied: RepairActionResult[];
  skipped: RepairActionResult[];
  escalated: RepairActionResult[];
  needsCopilot: boolean;
}

export type ArchitectureBotAnimationState =
  | 'idle'
  | 'scanning'
  | 'fixing'
  | 'healthy'
  | 'attention';

export interface ArchitectureBotCallbacks {
  onDetectAllRooms?: () => number;
  onUpdateWall?: (wallId: string, updates: { height: number }) => void;
  onUpdateOpening?: (openingId: string, updates: { width: number }) => void;
  onUpdateRoom?: (roomId: string, updates: { name: string }) => void;
  onSetJurisdiction?: (jurisdiction: 'au' | 'in') => void;
  onRepairGovernanceState?: () => number;
  onOpenCopilot?: () => void;
  onOpenCompliance?: () => void;
}
