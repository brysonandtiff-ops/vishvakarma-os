#!/usr/bin/env node

/**
 * Resolve pipeline tier steps from pipeline-manifest.json.
 *
 * @param {Record<string, { extends?: string; steps?: string[] }>} tiers
 * @param {string} tierName
 * @param {{ mergeExtends?: boolean; visited?: Set<string> }} [options]
 * @returns {string[]}
 */
export function resolveTierSteps(tiers, tierName, options = {}) {
  const { mergeExtends = false, visited = new Set() } = options;

  if (visited.has(tierName)) {
    throw new Error(`Circular pipeline tier extends: ${tierName}`);
  }
  visited.add(tierName);

  const tier = tiers[tierName];
  if (!tier) {
    throw new Error(`Unknown pipeline tier: ${tierName}`);
  }

  if (mergeExtends) {
    let steps = [];
    if (tier.extends) {
      steps = resolveTierSteps(tiers, tier.extends, { mergeExtends: true, visited });
    }
    if (tier.steps?.length) {
      steps = [...steps, ...tier.steps];
    }
    return steps;
  }

  if (tier.steps?.length) {
    return tier.steps;
  }
  if (tier.extends) {
    return resolveTierSteps(tiers, tier.extends, { mergeExtends: false, visited });
  }
  return [];
}
