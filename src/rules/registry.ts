import { doorWidthRule } from '@/rules/accessibility/doorWidthRule';
import { circulationWidthRule } from '@/rules/accessibility/circulationWidthRule';
import { glazingRatioRule } from '@/rules/energy/glazingRatioRule';
import { thermalComfortRule } from '@/rules/energy/thermalComfortRule';
import { egressPathRule } from '@/rules/fire/egressPathRule';
import { smokeAlarmZoneRule } from '@/rules/fire/smokeAlarmZoneRule';
import { bedroomEgressRule } from '@/rules/ncc/bedroomEgressRule';
import { bedroomSizeRule } from '@/rules/ncc/bedroomSizeRule';
import { habitableRoomHeightRule } from '@/rules/ncc/habitableRoomHeightRule';
import { coverageRule } from '@/rules/zoning/coverageRule';
import { setbackRule } from '@/rules/zoning/setbackRule';
import { councilConditionsRule } from '@/rules/zoning/councilConditionsRule';
import type { ComplianceCategory, ComplianceRule } from '@/rules/types';

const ALL_RULES: ComplianceRule[] = [
  bedroomSizeRule,
  bedroomEgressRule,
  habitableRoomHeightRule,
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

export function getAllComplianceRules(): ComplianceRule[] {
  return ALL_RULES;
}

export function getRulesByCategory(category: ComplianceCategory): ComplianceRule[] {
  return ALL_RULES.filter((rule) => rule.category === category);
}
