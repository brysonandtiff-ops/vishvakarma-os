import type { ProjectJurisdiction } from '@/domain/projects/jurisdiction';
import { doorWidthRule } from '@/rules/accessibility/doorWidthRule';
import { circulationWidthRule } from '@/rules/accessibility/circulationWidthRule';
import { glazingRatioRule } from '@/rules/energy/glazingRatioRule';
import { thermalComfortRule } from '@/rules/energy/thermalComfortRule';
import { egressPathRule } from '@/rules/fire/egressPathRule';
import { smokeAlarmZoneRule } from '@/rules/fire/smokeAlarmZoneRule';
import { nbcBedroomSizeRule } from '@/rules/nbc/bedroomSizeRule';
import { nbcHabitableRoomHeightRule } from '@/rules/nbc/habitableRoomHeightRule';
import { nbcStairWidthRule } from '@/rules/nbc/stairWidthRule';
import { nbcStairRiseRunRule } from '@/rules/nbc/stairRiseRunRule';
import { nbcRampGradientRule } from '@/rules/nbc/rampGradientRule';
import { nbcDeadEndCorridorRule } from '@/rules/nbc/deadEndCorridorRule';
import { bedroomEgressRule } from '@/rules/ncc/bedroomEgressRule';
import { bedroomSizeRule } from '@/rules/ncc/bedroomSizeRule';
import { habitableRoomHeightRule } from '@/rules/ncc/habitableRoomHeightRule';
import { coverageRule } from '@/rules/zoning/coverageRule';
import { setbackRule } from '@/rules/zoning/setbackRule';
import { councilConditionsRule } from '@/rules/zoning/councilConditionsRule';
import type { ComplianceCategory, ComplianceRule } from '@/rules/types';

const SHARED_RULES: ComplianceRule[] = [
  doorWidthRule,
  circulationWidthRule,
  thermalComfortRule,
  glazingRatioRule,
  setbackRule,
  coverageRule,
  egressPathRule,
  smokeAlarmZoneRule,
  councilConditionsRule,
];

const NCC_RULES: ComplianceRule[] = [
  bedroomSizeRule,
  bedroomEgressRule,
  habitableRoomHeightRule,
];

const NBC_RULES: ComplianceRule[] = [
  nbcBedroomSizeRule,
  nbcHabitableRoomHeightRule,
  nbcStairWidthRule,
  nbcStairRiseRunRule,
  nbcRampGradientRule,
  nbcDeadEndCorridorRule,
];

const ALL_RULES: ComplianceRule[] = [...NCC_RULES, ...NBC_RULES, ...SHARED_RULES];

export function getAllComplianceRules(): ComplianceRule[] {
  return ALL_RULES;
}

export function getComplianceRulesForJurisdiction(jurisdiction: ProjectJurisdiction): ComplianceRule[] {
  const codeRules = jurisdiction === 'in' ? NBC_RULES : NCC_RULES;
  return [...codeRules, ...SHARED_RULES];
}

export function getRulesByCategory(category: ComplianceCategory): ComplianceRule[] {
  return ALL_RULES.filter((rule) => rule.category === category);
}
