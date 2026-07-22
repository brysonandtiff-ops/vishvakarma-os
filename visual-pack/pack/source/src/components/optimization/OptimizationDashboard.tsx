import CandidateComparisonGrid from '@/components/optimization/CandidateComparisonGrid';
import CandidateRadarChart from '@/components/optimization/CandidateRadarChart';
import CandidateScoreBarChart from '@/components/optimization/CandidateScoreBarChart';
import CostIntelligencePanel from '@/components/optimization/CostIntelligencePanel';
import MoatGainPanel from '@/components/optimization/MoatGainPanel';
import OptimizationReportPanel from '@/components/optimization/OptimizationReportPanel';
import ScoreBreakdownPanel from '@/components/optimization/ScoreBreakdownPanel';
import SiteFitnessPanel from '@/components/optimization/SiteFitnessPanel';
import TradeoffDeltaChart from '@/components/optimization/TradeoffDeltaChart';
import TradeoffPanel from '@/components/optimization/TradeoffPanel';
import WinnerHeroPanel from '@/components/optimization/WinnerHeroPanel';
import CouncilApprovalPanel from '@/components/system-intelligence/CouncilApprovalPanel';
import DecisionExplainerPanel from '@/components/system-intelligence/DecisionExplainerPanel';
import SystemFlowHUD from '@/components/system-intelligence/SystemFlowHUD';
import type { MacroStep } from '@/components/system-intelligence/pipelineStageLabels';
import type { OptimizationBatch, OptimizationCandidate } from '@/domain/optimization/types';

export default function OptimizationDashboard({
  batch,
  selectedCandidate,
  runnerUp,
  winner,
  favorites,
  selectedId,
  compareId,
  saving,
  regenerating,
  activeMacroStep,
  onSelect,
  onFavorite,
  onPromote,
  onCompare,
  onSaveProject,
  onExportPermit,
  onExportPdf,
}: {
  batch: OptimizationBatch;
  selectedCandidate: OptimizationCandidate | null;
  runnerUp: OptimizationCandidate;
  winner: OptimizationCandidate;
  favorites: Set<string>;
  selectedId: string | null;
  compareId: string | null;
  saving?: boolean;
  regenerating?: boolean;
  activeMacroStep: MacroStep;
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
  onPromote: (candidate: OptimizationCandidate) => void;
  onCompare: (id: string) => void;
  onSaveProject: () => void;
  onExportPermit: () => void;
  onExportPdf: () => void;
}) {
  const completedMacro: MacroStep[] = [
    'Input',
    'Generate',
    'Optimize',
    'CostModel',
    'Compliance',
  ];

  return (
    <div className="space-y-6" data-testid="optimization-dashboard">
      <SystemFlowHUD
        variant="macro"
        activeStep={activeMacroStep}
        completedSteps={regenerating ? undefined : completedMacro}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <WinnerHeroPanel
            batch={batch}
            winner={winner}
            onPromote={() => onPromote(winner)}
            onSaveProject={onSaveProject}
            onExportPermit={onExportPermit}
            onExportPdf={onExportPdf}
            saving={saving}
          />
          <DecisionExplainerPanel winner={winner} runnerUp={runnerUp} report={batch.report} />
        </div>
        <div className="space-y-4">
          <MoatGainPanel moatGain={batch.report.moatGain} />
          {winner.building.councilAssessment && (
            <CouncilApprovalPanel assessment={winner.building.councilAssessment} />
          )}
        </div>
      </div>

      <CostIntelligencePanel intelligence={winner.building.costSummary.intelligence} />

      <CandidateScoreBarChart candidates={batch.candidates} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CandidateRadarChart candidate={selectedCandidate} />
        <TradeoffDeltaChart winner={winner} runnerUp={runnerUp} />
      </div>

      <CandidateComparisonGrid
        candidates={batch.candidates}
        winnerId={batch.winnerId}
        favorites={favorites}
        selectedId={selectedId}
        compareId={compareId}
        onSelect={onSelect}
        onFavorite={onFavorite}
        onPromote={onPromote}
        onCompare={onCompare}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreBreakdownPanel candidate={selectedCandidate} />
        <SiteFitnessPanel siteFitness={batch.siteFitness} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TradeoffPanel tradeoffs={batch.report.tradeoffs} />
        <OptimizationReportPanel batch={batch} />
      </div>
    </div>
  );
}
