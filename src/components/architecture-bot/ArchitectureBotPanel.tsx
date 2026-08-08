import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import CopilotSwanMark from '@/components/brand/CopilotSwanMark';
import { Button } from '@/components/ui/button';
import type { ArchitectureIssue } from '@/services/architecture-bot/types';

function IssueIcon({ severity }: { severity: ArchitectureIssue['severity'] }) {
  if (severity === 'fail') return <XCircle className="gate-fail h-3.5 w-3.5 shrink-0" />;
  if (severity === 'warning') return <AlertTriangle className="gate-warn h-3.5 w-3.5 shrink-0" />;
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export default function ArchitectureBotPanel({
  issues,
  fixing,
  onFixEverything,
  onOpenCopilot,
  onOpenCompliance,
  onClose,
}: {
  issues: ArchitectureIssue[];
  fixing: boolean;
  onFixEverything: () => void;
  onOpenCopilot?: () => void;
  onOpenCompliance?: () => void;
  onClose: () => void;
}) {
  const actionable = issues.filter((issue) => issue.severity !== 'info' || issue.autoFixable);
  const autoFixableCount = issues.filter((issue) => issue.autoFixable).length;
  const needsCopilot = issues.some((issue) => issue.navigateTo === 'copilot');

  return (
      <div
      className="vish-arch-bot-panel vish-fade-rise rounded-2xl border border-vish-navy-600/50 bg-vish-navy-950/80 p-4 shadow-2xl backdrop-blur-xl w-80"
      data-testid="architecture-bot-panel"
      role="dialog"
      aria-label="Architecture Bot"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-vish-gold/90">Architecture Copilot</p>
          <p className="mt-1 text-sm font-semibold text-white tracking-wide">
            {actionable.length === 0 ? 'Blueprint healthy' : `${actionable.length} issue${actionable.length === 1 ? '' : 's'} found`}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {actionable.length === 0
              ? 'Your project passes current checks.'
              : autoFixableCount > 0
                ? `${autoFixableCount} can be fixed automatically.`
                : 'Review items below or open Copilot.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 min-h-0 px-2 text-xs text-slate-400 hover:text-white hover:bg-vish-navy-800"
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto text-xs" aria-live="polite">
        {issues.length === 0 ? (
          <li className="flex items-center gap-2 rounded-xl border border-vish-navy-700/50 bg-vish-navy-900/50 px-3 py-2 text-slate-400">
            <CheckCircle2 className="gate-pass h-4 w-4 shrink-0" />
            <span>No issues detected.</span>
          </li>
        ) : (
          issues.slice(0, 8).map((issue) => (
            <li
              key={issue.id}
              className="flex items-start gap-2 rounded-xl border border-vish-navy-700/50 bg-vish-navy-900/40 px-3 py-2"
            >
              <IssueIcon severity={issue.severity} />
              <div className="min-w-0">
                <p className="font-semibold capitalize text-white">{issue.title}</p>
                <p className="mt-0.5 leading-relaxed text-slate-400">{issue.message}</p>
              </div>
            </li>
          ))
        )}
        {issues.length > 8 && (
          <li className="px-1 text-[10px] text-slate-500 font-technical">+ {issues.length - 8} more</li>
        )}
      </ul>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          size="full"
          className="min-h-[44px] bg-vish-gold hover:bg-vish-gold-light text-vish-navy-950 font-bold tracking-wide shadow-lg shadow-vish-gold/20"
          disabled={fixing || (actionable.length === 0 && autoFixableCount === 0)}
          onClick={onFixEverything}
          data-testid="architecture-bot-fix-all"
        >
          {fixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing…
            </>
          ) : (
            <>
              <CopilotSwanMark motion={fixing ? 'fixing' : 'idle'} size="xs" className="mr-2" />
              Fix everything
            </>
          )}
        </Button>
        {needsCopilot && onOpenCopilot && (
          <Button type="button" variant="outline" size="full" className="min-h-[44px] border-vish-navy-600/50 text-vish-gold hover:bg-vish-navy-800 hover:text-vish-gold-light" onClick={onOpenCopilot}>
            <CopilotSwanMark motion="idle" size="xs" className="mr-2" />
            Open Copilot
          </Button>
        )}
        {onOpenCompliance && actionable.some((issue) => issue.navigateTo === 'compliance') && (
          <Button type="button" variant="outline" size="full" className="min-h-[44px] border-vish-navy-600/50 text-slate-300 hover:bg-vish-navy-800 hover:text-white" onClick={onOpenCompliance}>
            View compliance
          </Button>
        )}
      </div>
    </div>
  );
}
