import { cn } from '@/lib/utils';
import type { PipelineStage } from '@/core-contract/pipeline.schema';
import { PIPELINE_STAGE_ORDER } from '@/core-contract/pipeline.schema';
import {
  MACRO_STEPS,
  MICRO_STAGE_LABELS,
  type MacroStep,
  isMacroStepComplete,
  isMicroStageComplete,
  pipelineStageToMacro,
} from '@/components/system-intelligence/pipelineStageLabels';

type SystemFlowHUDProps =
  | {
      variant: 'macro';
      activeStep: MacroStep | PipelineStage | 'scoring';
      completedSteps?: MacroStep[];
      className?: string;
    }
  | {
      variant: 'micro';
      activeStep: PipelineStage | 'scoring';
      completedSteps?: PipelineStage[];
      className?: string;
    };

function resolveMacroActive(activeStep: MacroStep | PipelineStage | 'scoring'): MacroStep {
  if (MACRO_STEPS.includes(activeStep as MacroStep)) {
    return activeStep as MacroStep;
  }
  return pipelineStageToMacro(activeStep as PipelineStage | 'scoring');
}

function resolveMicroActive(activeStep: PipelineStage | 'scoring'): PipelineStage {
  if (activeStep === 'scoring') return 'floorplan';
  return activeStep;
}

export default function SystemFlowHUD(props: SystemFlowHUDProps) {
  const { variant, className } = props;

  if (variant === 'macro') {
    const active = resolveMacroActive(props.activeStep);
    const completed = props.completedSteps;

    return (
      <div
        className={cn('flex flex-wrap gap-2 text-xs', className)}
        data-testid="system-flow-hud"
        role="list"
        aria-label="System pipeline progress"
      >
        {MACRO_STEPS.map((step) => {
          const isActive = step === active;
          const isComplete = isMacroStepComplete(step, active, completed);

          return (
            <div
              key={step}
              role="listitem"
              className={cn(
                'rounded border px-2 py-1 transition-colors',
                isActive && 'border-earth-500 text-earth-500',
                isComplete && !isActive && 'border-earth-500/40 text-earth-400/80',
                !isActive && !isComplete && 'border-gray-700 text-muted-foreground',
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              {step === 'CostModel' ? 'Cost Model' : step}
            </div>
          );
        })}
      </div>
    );
  }

  const active = resolveMicroActive(props.activeStep);
  const completed = props.completedSteps;
  const visibleStages = PIPELINE_STAGE_ORDER.filter((s) => s !== 'error');

  return (
    <div
      className={cn('flex flex-wrap gap-2 text-xs', className)}
      data-testid="system-flow-hud"
      role="list"
      aria-label="Pipeline stage progress"
    >
      {visibleStages.map((stage) => {
        const isActive = stage === active;
        const isComplete = isMicroStageComplete(stage, active, completed);

        return (
          <div
            key={stage}
            role="listitem"
            className={cn(
              'rounded border px-2 py-1 transition-colors',
              isActive && 'border-earth-500 text-earth-500',
              isComplete && !isActive && 'border-earth-500/40 text-earth-400/80',
              !isActive && !isComplete && 'border-gray-700 text-muted-foreground',
            )}
            aria-current={isActive ? 'step' : undefined}
          >
            {MICRO_STAGE_LABELS[stage]}
          </div>
        );
      })}
    </div>
  );
}
