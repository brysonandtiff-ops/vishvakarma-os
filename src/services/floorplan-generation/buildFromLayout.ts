import { analyzePanchatattva } from '@/core/simulations/panchatattva';
import { analyzeVastu } from '@/core/simulations/vastu';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import type { GeneratedBuilding, RoomPlacement } from '@/domain/buildings/generatedBuilding';
import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { OptimizationManifestMetadata } from '@/domain/optimization/types';
import type { PipelineStage } from '@/core-contract/pipeline.schema';
import { assertAllowedFlow } from '@/core-contract/systemFlow';
import { assessCouncilCompliance } from '@/services/council-intelligence/councilEngine';
import { buildArchitectureMap } from '@/ai/building-designer/generators/architectureMapGenerator';
import { generateConceptDesign } from '@/ai/building-designer/generators/conceptDesignGenerator';
import { generateFloorPlan } from '@/ai/building-designer/generators/floorplanGenerator';
import { generateMaterialList } from '@/ai/building-designer/generators/materialListGenerator';
import { generateSchedules } from '@/ai/building-designer/generators/scheduleGenerator';
import { generateSitePlan } from '@/ai/building-designer/generators/sitePlanGenerator';
import { buildManifestFromFloorPlan } from '@/ai/building-designer/transformers/manifestTransformer';
import { validateGeneratedBuilding } from '@/ai/building-designer/validators/generatedBuildingValidator';
import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import { buildCostSummary } from '@/services/cost-estimation/costSummary';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import type { Point2D } from '@/types';

export interface BuildFromLayoutInput {
  request: BuildingRequest;
  constraints: ConstraintResult;
  rooms: RoomPlacement[];
  circulation: Point2D[];
  prompt: string;
  council?: CouncilRequirements;
  sessionId?: string;
  uploadedDocuments?: CopilotManifestMetadata['uploadedDocuments'];
  ingestion?: { siteSurvey?: CopilotManifestMetadata['siteSurvey']; boundary?: CopilotManifestMetadata['boundary'] };
  optimization?: OptimizationManifestMetadata;
  targetBudget?: number;
  siteFitnessSetbackUtilization?: number;
  onStage?: (stage: PipelineStage) => void;
}

export function buildGeneratedBuildingFromLayout(input: BuildFromLayoutInput): GeneratedBuilding {
  input.onStage?.('floorplan');
  const floorPlan = generateFloorPlan(input.rooms, input.circulation);
  const sitePlan = generateSitePlan(input.request, input.rooms, input.council);
  const architectureMap = buildArchitectureMap(input.constraints.rooms);

  input.onStage?.('concept');
  let conceptDesign = generateConceptDesign(input.request, floorPlan, architectureMap);

  input.onStage?.('schedules');
  const schedules = generateSchedules(floorPlan);
  const materialList = generateMaterialList(floorPlan, schedules);

  const copilotMeta: CopilotManifestMetadata | undefined = input.council
    ? {
        sessionId: input.sessionId ?? crypto.randomUUID(),
        designBrief: input.prompt,
        council: input.council,
        siteSurvey: input.ingestion?.siteSurvey,
        boundary: input.ingestion?.boundary,
        uploadedDocuments: input.uploadedDocuments ?? [],
        generatedAt: new Date().toISOString(),
      }
    : undefined;

  const manifest = buildManifestFromFloorPlan(floorPlan, input.request, {
    prompt: input.prompt,
    request: input.request,
    sitePlan,
    schedules,
    architectureMap,
    generatedAt: new Date().toISOString(),
    copilot: copilotMeta,
    optimization: input.optimization,
  });

  const indianContext = /india|indian|vastu|mumbai|bengaluru|delhi|2bhk|3bhk|puja|mandir/i.test(
    input.prompt,
  );
  if (indianContext || input.optimization?.objective === 'vastu_harmonized') {
    manifest.jurisdiction = 'in';
    manifest.regionId = manifest.regionId ?? 'in-national';
    manifest.northOrientation = manifest.northOrientation ?? 0;
    const vastu = analyzeVastu(manifest);
    const pancha = analyzePanchatattva(manifest);
    conceptDesign = {
      ...conceptDesign,
      designIntent: `${conceptDesign.designIntent} Vastu-oriented Indian residential layout.`,
      adjacencyNotes: [
        ...conceptDesign.adjacencyNotes,
        `Vastu harmony ${vastu.harmonyPercent}% — ${vastu.tips[0] ?? 'Add room labels for sector scoring.'}`,
        `Panchatattva element balance ${pancha.balancePercent}%.`,
      ],
    };
  }

  const costSummary = buildCostSummary(manifest, {
    materialList,
    schedules,
    request: input.request,
    council: input.council,
    targetBudget: input.targetBudget,
  });

  input.onStage?.('compliance');
  const complianceReport = runComplianceAuditFromManifest(manifest, {
    id: input.sessionId,
    name: manifest.name,
  });

  if (input.optimization) {
    assertAllowedFlow('OPTIMIZATION_ENGINE', 'COMPLIANCE_GATE');
  }

  let councilAssessment = input.council
    ? assessCouncilCompliance(
        {
          request: input.request,
          sitePlan,
          floorPlan,
          schedules,
          architectureMap,
          manifest,
          costSummary,
          conceptDesign,
          materialList,
          complianceReport,
          copilot: copilotMeta,
        },
        input.council,
        { siteFitnessSetbackUtilization: input.siteFitnessSetbackUtilization },
      )
    : undefined;

  if (councilAssessment && input.council) {
    const councilSource = input.optimization ? 'OPTIMIZATION_ENGINE' : 'ARCHITECTURE_COPILOT';
    assertAllowedFlow(councilSource, 'COUNCIL_INTELLIGENCE');
    if (input.optimization) {
      assertAllowedFlow('COUNCIL_INTELLIGENCE', 'OPTIMIZATION_ENGINE');
    }
    if (copilotMeta) {
      copilotMeta.councilAssessment = councilAssessment;
      manifest.metadata.copilot = copilotMeta as unknown as Record<string, unknown>;
    }
  }

  const building: GeneratedBuilding = {
    request: input.request,
    sitePlan,
    floorPlan,
    schedules,
    architectureMap,
    manifest,
    costSummary,
    conceptDesign,
    materialList,
    complianceReport,
    copilot: copilotMeta,
    councilAssessment,
  };

  const errors = validateGeneratedBuilding(building);
  if (errors.length) {
    throw new Error(errors.join('; '));
  }

  return building;
}
