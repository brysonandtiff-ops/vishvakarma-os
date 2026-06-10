/**
 * PR / build gate declaration contract — anti-drift firewall for core changes.
 */

export interface ValuationImpactDeclaration {
  from: string;
  to: string;
  reason: string;
}

export interface BuildGateDeclaration {
  touchesCore: boolean;
  modifiesPipeline: boolean;
  affectsCompliance: boolean;
  affectsCostModel: boolean;
  requiresRevalidation: boolean;
  valuationImpact?: ValuationImpactDeclaration;
}

export const BUILD_GATE_ENFORCEMENT = {
  touchesCoreRequiresApproval: true,
  affectsComplianceRequiresFullRegression: true,
  affectsCostModelRequiresAnchorSuite: true,
  driftRequires: [
    'system-map.json',
    'src/core-contract/',
    'tests/anchors/',
    'SYSTEM_VERSIONS bump + changelog',
  ],
} as const;

export function validateBuildGate(gate: BuildGateDeclaration): string[] {
  const errors: string[] = [];
  if (gate.touchesCore && !gate.requiresRevalidation) {
    errors.push('touchesCore=true requires requiresRevalidation=true');
  }
  if (gate.affectsCostModel && !gate.valuationImpact?.reason) {
    errors.push('affectsCostModel=true requires valuationImpact.reason');
  }
  if (gate.affectsCompliance && !gate.requiresRevalidation) {
    errors.push('affectsCompliance=true requires requiresRevalidation=true');
  }
  return errors;
}
