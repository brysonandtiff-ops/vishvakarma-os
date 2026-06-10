import systemMap from '../../system-map.json';
import type { SystemMapContract } from '@/core-contract/system.schema';

const map = systemMap as SystemMapContract;

const allowedEdges = new Set(map.allowed_edges);
const forbiddenEdges = new Set(map.forbidden_edges);

export interface SystemFlowEvent {
  from: string;
  to: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const flowLog: SystemFlowEvent[] = [];

function edgeKey(from: string, to: string): string {
  return `${from}→${to}`;
}

function matchesExplicitRoute(from: string, to: string, context?: Record<string, unknown>): boolean {
  return map.explicit_routes.some((route) => {
    if (route.from !== from || route.to !== to) return false;
    if (!route.requires?.length) return true;
    return route.requires.every((key) => context?.[key] != null);
  });
}

export function assertAllowedFlow(
  from: string,
  to: string,
  context?: Record<string, unknown>,
): void {
  const edge = edgeKey(from, to);

  if (forbiddenEdges.has(edge)) {
    throw new Error(`[SYSTEM_DRIFT_BLOCKED] Forbidden flow: ${edge}`);
  }

  const isModuleEdge = map.modules[from] != null;
  if (isModuleEdge && !allowedEdges.has(edge) && !matchesExplicitRoute(from, to, context)) {
    throw new Error(`[SYSTEM_DRIFT_BLOCKED] Unregistered flow: ${edge}`);
  }

  recordSystemFlow({ from, to, context, timestamp: new Date().toISOString() });
}

export function recordSystemFlow(event: SystemFlowEvent): void {
  if (import.meta.env?.MODE === 'test' || import.meta.env?.DEV) {
    flowLog.push(event);
  }
}

export function getRecordedSystemFlows(): readonly SystemFlowEvent[] {
  return flowLog;
}

export function clearRecordedSystemFlows(): void {
  flowLog.length = 0;
}
