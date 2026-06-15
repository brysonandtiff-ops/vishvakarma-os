/** Rule IDs that require Architecture Copilot — layout / zoning / egress. */
export const COPILOT_ESCALATION_RULE_IDS = new Set([
  'zoning-setback',
  'zoning-coverage',
  'zoning-council-conditions',
  'fire-egress-path',
  'ncc-bedroom-egress',
  'ncc-bedroom-size',
  'nbc-bedroom-size',
  'energy-thermal-comfort',
  'energy-glazing-ratio',
  'access-circulation-width',
  'nbc-stair-width',
  'nbc-stair-rise-run',
  'fire-dead-end-corridor',
  'access-ramp-gradient',
]);

/** Rule IDs with deterministic manifest repairs. */
export const AUTO_FIX_RULE_IDS = new Set([
  'ncc-habitable-height',
  'nbc-habitable-height',
  'access-door-width',
  'fire-smoke-alarm-zone',
]);

export function isCopilotEscalation(ruleId: string): boolean {
  return COPILOT_ESCALATION_RULE_IDS.has(ruleId);
}

export function isAutoFixRule(ruleId: string): boolean {
  return AUTO_FIX_RULE_IDS.has(ruleId);
}
