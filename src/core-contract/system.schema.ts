/**
 * System-level contract: module identities, semver, tiers, and graph permissions.
 * Source of truth for versions — must match system-map.json module versions.
 */

export const SYSTEM_MAP_VERSION = '1.0.0';

export type SystemModuleId =
  | 'INPUT'
  | 'ARCHITECTURE_COPILOT'
  | 'OPTIMIZATION_ENGINE'
  | 'COMPLIANCE_GATE'
  | 'PERMIT_PACKAGE_EXPORT'
  | 'COST_INTELLIGENCE'
  | 'COUNCIL_INTELLIGENCE';

export type ModuleTier = 'immutable_core' | 'extension' | 'experimental';

export const SYSTEM_VERSIONS: Record<
  Exclude<SystemModuleId, 'INPUT' | 'PERMIT_PACKAGE_EXPORT'>,
  string
> = {
  ARCHITECTURE_COPILOT: '2.0.0',
  OPTIMIZATION_ENGINE: '1.3.0',
  COST_INTELLIGENCE: '0.9.0',
  COMPLIANCE_GATE: '1.0.0',
  COUNCIL_INTELLIGENCE: '1.0.0',
};

export const MODULE_TIERS: Record<SystemModuleId, ModuleTier> = {
  INPUT: 'immutable_core',
  ARCHITECTURE_COPILOT: 'immutable_core',
  OPTIMIZATION_ENGINE: 'immutable_core',
  COMPLIANCE_GATE: 'immutable_core',
  PERMIT_PACKAGE_EXPORT: 'extension',
  COST_INTELLIGENCE: 'extension',
  COUNCIL_INTELLIGENCE: 'extension',
};

export type SystemEdge = string;

export interface ExplicitRoute {
  id: string;
  from: SystemModuleId;
  to: SystemModuleId | string;
  tier: ModuleTier;
  description: string;
  requires?: string[];
}

export interface SystemMapContract {
  version: string;
  modules: Record<
    string,
    { version: string; tier: ModuleTier; ownership: string; spec?: string }
  >;
  allowed_edges: SystemEdge[];
  forbidden_edges: SystemEdge[];
  explicit_routes: ExplicitRoute[];
}

export function assertSystemVersionsMatchMap(map: SystemMapContract): void {
  for (const [moduleId, version] of Object.entries(SYSTEM_VERSIONS)) {
    const entry = map.modules[moduleId];
    if (!entry) {
      throw new Error(`system-map.json missing module: ${moduleId}`);
    }
    if (entry.version !== version) {
      throw new Error(
        `Version drift: ${moduleId} is ${entry.version} in system-map but ${version} in SYSTEM_VERSIONS`,
      );
    }
  }
}
