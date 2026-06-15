import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { applyArchitectureRepairs } from '@/services/architecture-bot/repairOrchestrator';
import { countActionableIssues, scanArchitectureIssues } from '@/services/architecture-bot/scanIssues';
import type {
  ArchitectureBotAnimationState,
  ArchitectureBotCallbacks,
  ArchitectureIssue,
} from '@/services/architecture-bot/types';
import type { ProjectManifest } from '@/types';

function deriveAnimationState(
  fixing: boolean,
  scanning: boolean,
  issueCount: number,
): ArchitectureBotAnimationState {
  if (fixing) return 'fixing';
  if (scanning) return 'scanning';
  if (issueCount === 0) return 'healthy';
  if (issueCount > 0) return 'attention';
  return 'idle';
}

export function useArchitectureBot({
  manifest,
  projectId,
  projectName,
  revision = 0,
  callbacks,
}: {
  manifest: ProjectManifest;
  projectId?: string;
  projectName: string;
  revision?: number;
  callbacks: ArchitectureBotCallbacks;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanGeneration, setScanGeneration] = useState(0);

  const issues = useMemo(
    () =>
      scanArchitectureIssues(manifest, {
        projectId,
        projectName,
        isDev: import.meta.env.DEV,
      }),
    [manifest, projectId, projectName, revision, scanGeneration],
  );

  const issueCount = countActionableIssues(issues);
  const animationState = deriveAnimationState(fixing, scanning, issueCount);

  const rescan = useCallback(() => {
    setScanning(true);
    setScanGeneration((value) => value + 1);
    window.setTimeout(() => setScanning(false), 450);
  }, []);

  useEffect(() => {
    rescan();
  }, [revision, rescan]);

  const fixEverything = useCallback(async () => {
    setFixing(true);
    try {
      const summary = applyArchitectureRepairs(issues, manifest, callbacks);
      rescan();

      const appliedCount = summary.applied.length;
      const escalatedCount = summary.escalated.length;

      if (appliedCount > 0 && escalatedCount > 0) {
        toast.success(`Applied ${appliedCount} fix${appliedCount === 1 ? '' : 'es'}`, {
          description: `${escalatedCount} item${escalatedCount === 1 ? '' : 's'} need Architecture Copilot.`,
        });
      } else if (appliedCount > 0) {
        toast.success(`Applied ${appliedCount} fix${appliedCount === 1 ? '' : 'es'}.`);
      } else if (escalatedCount > 0) {
        toast.message('Architecture Copilot opened', {
          description: 'Complex layout issues need AI-assisted redesign.',
        });
      } else {
        toast.message('Nothing to auto-fix', {
          description: 'Review compliance details or adjust the plan manually.',
        });
      }
    } finally {
      setFixing(false);
    }
  }, [callbacks, issues, manifest, rescan]);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => setPanelOpen((open) => !open), []);

  return {
    issues: issues as ArchitectureIssue[],
    issueCount,
    animationState,
    panelOpen,
    fixing,
    fixEverything,
    openPanel,
    closePanel,
    togglePanel,
    rescan,
  };
}
