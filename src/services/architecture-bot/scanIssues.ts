import { resolveJurisdiction } from '@/domain/projects/jurisdiction';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import { getFailFindings, getWarningFindings } from '@/services/compliance/complianceGate';
import { isAutoFixRule, isCopilotEscalation } from '@/services/architecture-bot/issueCatalog';
import type { ArchitectureIssue } from '@/services/architecture-bot/types';
import type { ComplianceFinding } from '@/rules/types';
import type { ProjectManifest } from '@/types';

const GOVERNANCE_KEYS = [
  { key: 'governance-event-log', label: 'Governance event log' },
  { key: 'version-control-state', label: 'Version control state' },
  { key: 'theme', label: 'Theme preference' },
  { key: 'accessibility-settings', label: 'Accessibility settings' },
] as const;

function findingToIssue(finding: ComplianceFinding, index: number): ArchitectureIssue {
  const autoFixable = isAutoFixRule(finding.ruleId);
  const needsCopilot = isCopilotEscalation(finding.ruleId);

  return {
    id: `compliance-${finding.ruleId}-${index}`,
    title: finding.ruleId.replace(/-/g, ' '),
    message: finding.message,
    severity: finding.status === 'fail' ? 'fail' : 'warning',
    category: finding.category,
    autoFixable,
    ruleId: finding.ruleId,
    roomId: finding.roomId,
    navigateTo: needsCopilot ? 'copilot' : finding.status === 'fail' ? 'compliance' : undefined,
  };
}

function scanStructureIssues(manifest: ProjectManifest): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const wallCount = manifest.walls.length;
  const roomCount = manifest.rooms?.length ?? 0;

  if (wallCount === 0) {
    issues.push({
      id: 'structure-empty-project',
      title: 'Empty project',
      message: 'Draw walls or load a sample blueprint to begin.',
      severity: 'info',
      category: 'structure',
      autoFixable: false,
      navigateTo: 'copilot',
    });
    return issues;
  }

  if (wallCount > 3 && roomCount === 0) {
    issues.push({
      id: 'structure-missing-rooms',
      title: 'Rooms not detected',
      message: 'Walls are present but no rooms are labelled — run room detection.',
      severity: 'warning',
      category: 'structure',
      autoFixable: true,
      ruleId: 'structure-missing-rooms',
    });
  }

  if (!manifest.jurisdiction) {
    issues.push({
      id: 'structure-missing-jurisdiction',
      title: 'Locale not set',
      message: 'Set Australia or India locale for compliance pre-checks.',
      severity: 'info',
      category: 'structure',
      autoFixable: true,
      ruleId: 'structure-missing-jurisdiction',
    });
  }

  return issues;
}

function scanGovernanceIssues(isDev: boolean): ArchitectureIssue[] {
  if (!isDev || typeof localStorage === 'undefined') return [];

  const issues: ArchitectureIssue[] = [];
  for (const { key, label } of GOVERNANCE_KEYS) {
    if (localStorage.getItem(key) === null) {
      issues.push({
        id: `session-governance-${key}`,
        title: 'Session setup',
        message: `${label} is not initialized.`,
        severity: 'info',
        category: 'session',
        autoFixable: true,
        ruleId: 'governance-localStorage',
      });
    }
  }
  return issues;
}

export function scanArchitectureIssues(
  manifest: ProjectManifest,
  meta?: { projectId?: string; projectName?: string; isDev?: boolean },
): ArchitectureIssue[] {
  const report = runComplianceAuditFromManifest(manifest, {
    id: meta?.projectId,
    name: meta?.projectName ?? manifest.name,
  });

  const complianceIssues = [
    ...getFailFindings(report).map((f, i) => findingToIssue(f, i)),
    ...getWarningFindings(report).map((f, i) => findingToIssue(f, i + 1000)),
  ];

  if (report.blocked) {
    complianceIssues.unshift({
      id: 'export-blocked',
      title: 'Export blocked',
      message: 'Resolve compliance failures before exporting.',
      severity: 'fail',
      category: 'export',
      autoFixable: complianceIssues.some((issue) => issue.autoFixable),
      navigateTo: 'compliance',
    });
  }

  const structureIssues = scanStructureIssues(manifest);
  const sessionIssues = scanGovernanceIssues(meta?.isDev ?? import.meta.env.DEV);

  const jurisdiction = resolveJurisdiction(manifest);
  void jurisdiction;

  return [...complianceIssues, ...structureIssues, ...sessionIssues];
}

export function countActionableIssues(issues: ArchitectureIssue[]): number {
  return issues.filter((issue) => issue.severity !== 'info' || issue.autoFixable).length;
}
