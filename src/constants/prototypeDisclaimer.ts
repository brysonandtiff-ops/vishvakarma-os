export const PROTOTYPE_BADGE =
  'Prototype system — outputs may be experimental or incomplete';

export const PROTOTYPE_MODULE_COST =
  'Early-stage cost engine. Figures are simulated for design validation and may not reflect final production-grade pricing.';

export const PROTOTYPE_MODULE_COMPLIANCE =
  'Automated NCC stub checks — simulated compliance layer, not certified for council lodgement.';

export const PROTOTYPE_MODULE_COPILOT =
  'Experimental computation layer. Some deliverables are simulated or partially implemented.';

export const PROTOTYPE_MODULE_OPTIMIZATION =
  'Multi-candidate scoring uses experimental engines; rankings are for design exploration, not final certification.';

export type PrototypeModuleVariant = 'cost' | 'compliance' | 'copilot' | 'optimization';

export const PROTOTYPE_MODULE_TEXT: Record<PrototypeModuleVariant, string> = {
  cost: PROTOTYPE_MODULE_COST,
  compliance: PROTOTYPE_MODULE_COMPLIANCE,
  copilot: PROTOTYPE_MODULE_COPILOT,
  optimization: PROTOTYPE_MODULE_OPTIMIZATION,
};
